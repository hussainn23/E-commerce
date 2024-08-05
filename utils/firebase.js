const admin = require('firebase-admin');
const serviceAccount = require('../firebase/blood-donors-95ef1-firebase-adminsdk-yczel-d58b20f008.json');

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  storageBucket: process.env.STORAGE_BUCKET
});

const bucket = admin.storage().bucket();

module.exports = bucket;

