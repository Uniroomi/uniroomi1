// Firebase Cloud Functions for SMS Integration
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

// Twilio SMS sending function
async function sendSMSViaTwilio(phoneNumber, code, appName) {
  const message = `${appName} verification code: ${code}. Valid for 5 minutes.`;
  
  const response = await axios.post(
    `https://api.twilio.com/2010-04-01/Accounts/${twilioAccountSid}/Messages.json`,
    new URLSearchParams({
      To: phoneNumber,
      From: twilioPhoneNumber,
      Body: message
    }),
    {
      auth: {
        username: twilioAccountSid,
        password: twilioAuthToken
      },
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded'
      }
    }
  );

  return {
    messageId: response.data.sid,
    status: response.data.status
  };
}

// AWS SNS SMS sending function (fallback)
async function sendSMSViaSNS(phoneNumber, code, appName) {
  const message = `${appName} verification code: ${code}. Valid for 5 minutes.`;
  
  const response = await axios.post(
    `https://sns.${awsRegion}.amazonaws.com/`,
    `Action=Publish&PhoneNumber=${encodeURIComponent(phoneNumber)}&Message=${encodeURIComponent(message)}`,
    {
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'X-Amz-Date': new Date().toISOString().replace(/[:\-]|\.\d{3}/g, '')
      }
    }
  );

  return {
    messageId: response.data.PublishResponse.PublishResult.MessageId,
    status: 'sent'
  };
}

// Rate limiting function
async function checkRateLimit(phoneNumber) {
  const now = Date.now();
  const windowMs = 60 * 1000; // 1 minute
  const maxRequests = 1;
  
  const rateLimitRef = admin.firestore().collection('rateLimits').doc(phoneNumber);
  const doc = await rateLimitRef.get();
  
  if (doc.exists) {
    const data = doc.data();
    const requests = data.requests || [];
    const recentRequests = requests.filter(timestamp => now - timestamp < windowMs);
    
    if (recentRequests.length >= maxRequests) {
      throw new functions.https.HttpsError('resource-exhausted', 'Too many SMS requests. Please wait before trying again.');
    }
    
    recentRequests.push(now);
    await rateLimitRef.update({ requests: recentRequests });
  } else {
    await rateLimitRef.set({ requests: [now] });
  }
}

// Clean up old rate limit data
exports.cleanupRateLimits = functions.pubsub.schedule('every 1 hours').onRun(async (context) => {
  const cutoffTime = Date.now() - (24 * 60 * 60 * 1000); // 24 hours ago
  const rateLimitsRef = admin.firestore().collection('rateLimits');
  const snapshot = await rateLimitsRef.where('requests', 'array-contains', cutoffTime).get();
  
  const batch = admin.firestore().batch();
  snapshot.forEach(doc => {
    batch.delete(doc.ref);
  });
  
  await batch.commit();
  console.log(`Cleaned up ${snapshot.size} expired rate limit entries`);
});
