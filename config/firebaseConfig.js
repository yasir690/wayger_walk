const admin = require('firebase-admin');
const serviceAccount = require('../ollie-f122b-firebase-adminsdk-fbsvc-7d292030e9.json'); // adjust filename if needed

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
});

module.exports = admin;