import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import Stripe from 'stripe';
import bodyParser from 'body-parser';
import dotenv from 'dotenv';
import sgMail from '@sendgrid/mail';

import { Blockfrost, Lucid } from "lucid-cardano"; // NPM
import { Client, Hbar, TransferTransaction } from "@hashgraph/sdk";
const hederaClient = Client.forTestnet();

dotenv.config();
const app = express();
const stripe = new Stripe(process.env.STRIPE_SECRET);
sgMail.setApiKey(process.env.SENDGRID_API_KEY)

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);


const lucid = await Lucid.new(
  new Blockfrost("https://cardano-preview.blockfrost.io/api/v0", process.env.BLOCKFROST_SECRET),
  "Preview",
);

const YOUR_DOMAIN = 'http://localhost:4242';

app.use(express.static(path.join(__dirname, 'public')));
app.use(bodyParser.json());


app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.get('/claim-ada', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'claim-ada.html'));
});

app.post('/claim-ada', async (req, res) => {
  const {address} = req.body;
  
  lucid.selectWalletFromSeed(process.env.SEED_PHRASE, {addressType: "Base"})
  const tx = await lucid.newTx()
    .payToAddress(address, { lovelace: 5000000 })
    .complete()
    .then((tx) => tx.sign().complete())
    .then((tx) => tx.submit())
    .then(txHash => console.log(txHash))
    .catch((e) => console.log(e));

  res.redirect(303, '/successful-payment');

});

app.get('/claim-hbar', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'claim-hbar.html'));
});

app.post('/claim-hbar', async (req, res) => {
  const {address} = req.body;

  hederaClient.setOperator(process.env.HBAR_ID, process.env.HBAR_PRV);

  const sendHbar = await new TransferTransaction()
        .addHbarTransfer(process.env.HBAR_ID, Hbar.fromTinybars(-1000000000))
        .addHbarTransfer(address, Hbar.fromTinybars(1000000000))
        .execute(hederaClient);
  const transactionReceipt = await sendHbar.getReceipt(hederaClient);
  console.log("The transfer transaction from my account to the new account was: " + transactionReceipt.status.toString());
        
  res.redirect(303, '/successful-payment');
});

app.get('/checkout', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'checkout.html'));
});

app.get('/successful-payment', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'successful-payment.html'));
});

app.get('/cancel-payment', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'cancel-payment.html'));
});

app.post('/create-checkout-session', async (req, res) => {
    const session = await stripe.checkout.sessions.create({
      line_items: [
        {
          // Provide the exact Price ID (for example, pr_1234) of the product you want to sell
          price: 'price_1MV5jkK4cnhnlETsUTpP3RMJ',
          quantity: 1,
        },
      ],
      mode: 'payment',
      success_url: `${YOUR_DOMAIN}/successful-payment.html`,
      cancel_url: `${YOUR_DOMAIN}/cancel-payment.html`,
    });
    res.redirect(303, session.url);
});

app.post('/webhook', async (req, res) => {
  const event = req.body;

  // Handle the event
  switch (event.type) {
    case 'charge.succeeded':
      const chargeObj = event.data.object;
      console.log(chargeObj)
      const msg = {
        to: chargeObj.receipt_email, // Change to your recipient
        from: 'cardano@clubs.queensu.ca', // Change to your verified sender
        subject: 'ADA Gift Card Receipt',
        html: `<div><p>The Cardano at Queen's Univeristy Team thanks you for purchasing ADA with us today.</p><p>Your receipt is viewable <a href=${chargeObj.receipt_url}>here.</a></p><p>Your gift card has been delivered to ${chargeObj.statement_descriptor}.</div>`,
      }
      const msg2 = {
        to: chargeObj.statement_descriptor, // Change to your recipient
        from: 'cardano@clubs.queensu.ca', // Change to your verified sender
        subject: 'ADA Gift Card',
        html: `<div><p>${chargeObj.receipt_email} bought you $${chargeObj.amount/100} ${chargeObj.currency} worth of ADA! Claim it now using the <a href="http://localhost:4242/claim-ada">Cardano Gift Card Claimer</a></p></div>`,
      }
      sgMail
        .send(msg)
        .then(() => {
          console.log(`Receipt Email sent to  ${chargeObj.receipt_email}`)
        })
        .then(() => {
          sgMail.send(msg2)
        })
        .then(() => {
          console.log(`Gift Card sent to ${chargeObj.statement_descriptor}`)
        })
        .catch((error) => {
          console.error(error)
        })
      break;
    // ... handle other event types
    default:
      console.log(`Unhandled event type ${event.type}`);
  }

  // Return a response to acknowledge receipt of the event
  res.json({received: true});
});

const PORT = process.env.PORT || 4242;
app.listen(PORT, () => {
    console.log(`Server started on port ${PORT}`);
});
