require('dotenv').config();
const express = require('express');
const path = require('path');
const app = express();
const stripe = require('stripe')(process.env.STRIPE_SECRET);


app.use(express.static(path.join(__dirname, 'public')));

const YOUR_DOMAIN = 'http://localhost:4242';

app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.get('/claim-ada', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'claim-ada.html'));
});

// app.get('/checkout', (req, res) => {
//     res.sendFile(path.join(__dirname, 'public', 'checkout.html'));
// });

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
