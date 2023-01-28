require('dotenv').config();
const express = require('express');
const path = require('path');
const app = express();
const stripe = require('stripe')(process.env.STRIPE_SECRET);
const bodyParser = require("body-parser");
const {auth} = require('./firebase.js');

const  { createUserWithEmailAndPassword, signInWithEmailAndPassword, signOut   } = require ('firebase/auth');


const YOUR_DOMAIN = 'http://localhost:4242';

app.use(express.static(path.join(__dirname, 'public')));
app.use(bodyParser.json());


app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.get('/claim-ada', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'claim-ada.html'));
});

app.get('/checkout', (req, res) => {
  if(!auth.currentUser){
    res.redirect('/signin')
  } else{
    res.sendFile(path.join(__dirname, 'public', 'checkout.html'));
  }
});

app.get('/successful-payment', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'successful-payment.html'));
});

app.get('/cancel-payment', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'cancel-payment.html'));
});

app.get('/signup', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'signup.html'));
});

app.get('/signin', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'signin.html'));
});


app.post('/signup', async (req, res) => {
  const { email, password } = req.body;
  createUserWithEmailAndPassword(auth, email, password)
  .then((userCredential) => {
    // Signed in 
    const user = userCredential.user;
    console.log(user.uid)

    // ...
  })
  .catch((error) => {
    const errorCode = error.code;
    const errorMessage = error.message;
    console.log(errorMessage)
    // ..
  });

});

app.post('/signin', async (req, res) => {
  if(!auth.currentUser){
    const { email, password } = req.body;
    signInWithEmailAndPassword(auth, email, password)
    .then((userCredential) => {
      // Signed in 
      const user = userCredential.user;
      console.log(user.uid)
      res.redirect("/")
    })
    .catch((error) => {
      const errorCode = error.code;
      const errorMessage = error.message;
      console.log(errorMessage)
    });
  }
});

app.get('/signout', async (req, res) => {
  signOut(auth).then(() => {
    console.log("Sign out success")
  }).catch((error) => {
    console.log(errorMessage)
  });

  res.redirect(303, '/');
});

app.post('/create-checkout-session', async (req, res) => {
  if(!auth.currentUser){
    res.redirect('/signin')
  } else {
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
  }
  
});

const PORT = process.env.PORT || 4242;
app.listen(PORT, () => {
    console.log(`Server started on port ${PORT}`);
});
