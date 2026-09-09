// إعدادات Firebase
const firebaseConfig = {
    apiKey: "AIzaSyB08RzcPJe9B1gElNfgqS-hr-C8eTROQLw",
    authDomain: "jasoft-8bae9.firebaseapp.com",
    projectId: "jasoft-8bae9",
    storageBucket: "jasoft-8bae9.firebasestorage.app",
    messagingSenderId: "263989164835",
    appId: "1:263989164835:web:1fa891e67b032d8503aa96",
    measurementId: "G-VG4844PBW6"
};

firebase.initializeApp(firebaseConfig);
const auth = firebase.auth();
const db = firebase.firestore();