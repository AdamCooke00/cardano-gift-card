const { initializeApp } = require('firebase/app')
const { getAuth } = require('firebase/auth')
require('dotenv').config();


const firebaseConfig = {
  apiKey: process.env.FIREBASE_SECRET,
  authDomain: "cardano-gift-card.firebaseapp.com",
  projectId: "cardano-gift-card",
  storageBucket: "cardano-gift-card.appspot.com",
  messagingSenderId: "147639308335",
  appId: "1:147639308335:web:65dfc1a056e2e6f046b6da",
  measurementId: "G-G536V10DPR"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

const auth = getAuth(app);

module.exports.auth = auth
module.exports.app = app