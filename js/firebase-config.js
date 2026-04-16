// Firebase Configuration
const firebaseConfig = {
    apiKey: "AIzaSyDummyApiKeyForTesting",
    authDomain: "uniroomi.firebaseapp.com",
    databaseURL: "https://uniroomi.firebaseio.com",
    projectId: "uniroomi",
    storageBucket: "uniroomi.appspot.com",
    messagingSenderId: "123456789",
    appId: "1:123456789:web:abcdef123456"
};

// Initialize Firebase
if (typeof firebase !== 'undefined' && !firebase.apps.length) {
    firebase.initializeApp(firebaseConfig);
}
