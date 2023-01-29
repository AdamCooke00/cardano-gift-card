import express from 'express';
import {auth} from './firebase.js';
import { createUserWithEmailAndPassword, signInWithEmailAndPassword, signOut   } from 'firebase/auth';
import path from 'path';
import { fileURLToPath } from 'url';
import stripe from 'stripe';
import bodyParser from 'body-parser';
import dotenv from 'dotenv';

import { Blockfrost, Lucid } from "lucid-cardano"; // NPM


dotenv.config();
const app = express();
stripe(process.env.STRIPE_SECRET);

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
    .payToAddress(address, { lovelace: 10000000 })
    .complete()
    .then((tx) => tx.sign().complete())
    .then((tx) => tx.submit())
    .then(txHash => console.log(txHash))
    .catch((e) => console.log(e));

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

const PORT = process.env.PORT || 4242;
app.listen(PORT, () => {
    console.log(`Server started on port ${PORT}`);
});
