const nodemailer = require('nodemailer');

// Create transporter with error handling
let transporter;

try {
  if (process.env.EMAIL_USER && process.env.EMAIL_PASS) {
    transporter = nodemailer.createTransport({
      service: 'Gmail',
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS
      }
    });
    console.log('✅ Email transporter configured');
  } else {
    console.warn('⚠️ Email credentials not configured. Email features will not work.');
    // Create a dummy transporter that will fail gracefully
    transporter = {
      sendMail: async (options) => {
        console.warn('⚠️ Email not configured. Would send:', options.subject, 'to:', options.to);
        throw new Error('Email service not configured. Please set EMAIL_USER and EMAIL_PASS in .env file');
      }
    };
  }
} catch (error) {
  console.error('❌ Error configuring email transporter:', error);
  transporter = {
    sendMail: async () => {
      throw new Error('Email service not available');
    }
  };
}

module.exports = transporter;