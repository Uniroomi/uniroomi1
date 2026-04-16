// Firebase Cloud Functions for SMS Integration
// Save this as functions/index.js in your Firebase project

const functions = require('firebase-functions');
const admin = require('firebase-admin');
const axios = require('axios');

// Initialize Firebase Admin
admin.initializeApp();

// Twilio configuration (replace with your credentials)
const twilioAccountSid = 'YOUR_TWILIO_ACCOUNT_SID';
const twilioAuthToken = 'YOUR_TWILIO_AUTH_TOKEN';
const twilioPhoneNumber = '+1234567890'; // Your Twilio phone number

// Alternative: AWS SNS configuration
const awsAccessKeyId = 'YOUR_AWS_ACCESS_KEY';
const awsSecretAccessKey = 'YOUR_AWS_SECRET_KEY';
const awsRegion = 'af-south-1'; // Africa (Cape Town)

// Send SMS verification code
exports.sendVerificationSMS = functions.https.onCall(async (data, context) => {
  const { phoneNumber, verificationCode, appName } = data;

  // Validate input
  if (!phoneNumber || !verificationCode) {
    throw new functions.https.HttpsError('invalid-argument', 'Phone number and verification code are required');
  }

  // Validate phone number format (South Africa)
  const phoneRegex = /^\+27\d{9}$/;
  if (!phoneRegex.test(phoneNumber)) {
    throw new functions.https.HttpsError('invalid-argument', 'Invalid South African phone number format');
  }

  try {
    // Choose SMS provider (Twilio or AWS SNS)
    const result = await sendSMSViaTwilio(phoneNumber, verificationCode, appName);
    
    return {
      success: true,
      messageId: result.messageId,
      provider: 'twilio'
    };

  } catch (error) {
    console.error('SMS sending failed:', error);
    throw new functions.https.HttpsError('internal', 'Failed to send SMS verification code');
  }
});

// Twilio SMS implementation
async function sendSMSViaTwilio(phoneNumber, code, appName) {
  const message = `Your ${appName} verification code is: ${code}. Valid for 5 minutes.`;

  const auth = Buffer.from(`${twilioAccountSid}:${twilioAuthToken}`).toString('base64');

  try {
    const response = await axios.post(
      `https://api.twilio.com/2010-04-01/Accounts/${twilioAccountSid}/Messages.json`,
      new URLSearchParams({
        From: twilioPhoneNumber,
        To: phoneNumber,
        Body: message
      }),
      {
        headers: {
          'Authorization': `Basic ${auth}`,
          'Content-Type': 'application/x-www-form-urlencoded'
        }
      }
    );

    return {
      messageId: response.data.sid,
      status: response.data.status
    };

  } catch (error) {
    console.error('Twilio error:', error.response?.data || error.message);
    throw new Error('Twilio SMS sending failed');
  }
}

// AWS SNS SMS implementation (alternative)
async function sendSMSViaSNS(phoneNumber, code, appName) {
  const AWS = require('aws-sdk');
  
  AWS.config.update({
    accessKeyId: awsAccessKeyId,
    secretAccessKey: awsSecretAccessKey,
    region: awsRegion
  });

  const sns = new AWS.SNS();
  const message = `Your ${appName} verification code is: ${code}. Valid for 5 minutes.`;

  const params = {
    Message: message,
    PhoneNumber: phoneNumber,
    MessageAttributes: {
      'AWS.SNS.SMS.SMSType': {
        DataType: 'String',
        StringValue: 'Transactional'
      },
      'AWS.SNS.SMS.SenderID': {
        DataType: 'String',
        StringValue: 'UniRoomi'
      }
    }
  };

  try {
    const result = await sns.publish(params).promise();
    
    return {
      messageId: result.MessageId,
      status: 'sent'
    };

  } catch (error) {
    console.error('AWS SNS error:', error);
    throw new Error('AWS SNS SMS sending failed');
  }
}

// Rate limiting function
const rateLimitMap = new Map();

function checkRateLimit(phoneNumber, windowMs = 60000, maxRequests = 1) {
  const now = Date.now();
  const windowStart = now - windowMs;
  
  if (!rateLimitMap.has(phoneNumber)) {
    rateLimitMap.set(phoneNumber, []);
  }
  
  const requests = rateLimitMap.get(phoneNumber);
  
  // Remove old requests outside the window
  const validRequests = requests.filter(timestamp => timestamp > windowStart);
  
  if (validRequests.length >= maxRequests) {
    return false; // Rate limit exceeded
  }
  
  // Add current request
  validRequests.push(now);
  rateLimitMap.set(phoneNumber, validRequests);
  
  return true; // Request allowed
}

// Enhanced SMS function with rate limiting
exports.sendVerificationSMSWithRateLimit = functions.https.onCall(async (data, context) => {
  const { phoneNumber, verificationCode, appName } = data;

  // Check rate limiting
  if (!checkRateLimit(phoneNumber)) {
    throw new functions.https.HttpsError('resource-exhausted', 'Too many SMS requests. Please wait before trying again.');
  }

  // Log SMS sending for analytics
  await admin.firestore().collection('sms_logs').add({
    phoneNumber: phoneNumber.replace(/(\d{3})\d{4}(\d{4})/, '$1****$2'), // Mask phone number
    timestamp: admin.firestore.FieldValue.serverTimestamp(),
    provider: 'twilio',
    status: 'sent'
  });

  // Send SMS
  return await sendVerificationSMS(data, context);
});

// Verify SMS code (server-side validation)
exports.verifySMSCode = functions.https.onCall(async (data, context) => {
  const { phoneNumber, code, expectedCode } = data;

  if (!phoneNumber || !code || !expectedCode) {
    throw new functions.https.HttpsError('invalid-argument', 'Missing required parameters');
  }

  // Verify the code
  if (code === expectedCode) {
    return {
      success: true,
      message: 'Verification successful'
    };
  } else {
    throw new functions.https.HttpsError('invalid-argument', 'Invalid verification code');
  }
});

// Clean up old rate limit entries (run every hour)
exports.cleanupRateLimit = functions.pubsub.schedule('every 60 minutes').onRun(async (context) => {
  const now = Date.now();
  const windowMs = 60000; // 1 minute window
  
  for (const [phoneNumber, requests] of rateLimitMap.entries()) {
    const validRequests = requests.filter(timestamp => now - timestamp < windowMs);
    
    if (validRequests.length === 0) {
      rateLimitMap.delete(phoneNumber);
    } else {
      rateLimitMap.set(phoneNumber, validRequests);
    }
  }
  
  console.log('Rate limit cleanup completed');
});

// Analytics: Track SMS usage
exports.trackSMSUsage = functions.firestore.document('sms_logs/{logId}').onCreate(async (snap, context) => {
  const log = snap.data();
  
  // Update analytics
  await admin.firestore().collection('analytics').doc('sms_usage').set({
    totalSent: admin.firestore.FieldValue.increment(1),
    lastUpdated: admin.firestore.FieldValue.serverTimestamp()
  }, { merge: true });
});

// Package.json for Firebase Functions
/*
{
  "name": "uniroomi-sms-functions",
  "version": "1.0.0",
  "description": "Firebase Cloud Functions for UniRoomi SMS authentication",
  "scripts": {
    "serve": "firebase emulators:start --only functions",
    "shell": "firebase functions:shell",
    "start": "npm run shell",
    "deploy": "firebase deploy --only functions",
    "logs": "firebase functions:log"
  },
  "engines": {
    "node": "16"
  },
  "main": "index.js",
  "dependencies": {
    "firebase-admin": "^10.0.0",
    "firebase-functions": "^3.18.0",
    "axios": "^0.26.1",
    "aws-sdk": "^2.1100.0"
  },
  "devDependencies": {
    "firebase-functions-test": "^0.2.3"
  },
  "private": true
}
*/

// Firebase CLI deployment commands:
/*
# Install Firebase CLI
npm install -g firebase-tools

# Login to Firebase
firebase login

# Initialize Firebase project
firebase init functions

# Install dependencies
cd functions
npm install

# Deploy functions
firebase deploy --only functions

# Test locally
firebase emulators:start
*/
