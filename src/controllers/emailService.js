const nodemailer = require('nodemailer');

const sendEmail = async (to, subject, html) => {
  // Create a nodemailer transporter
  const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: 'notesappcs343@gmail.com',
      pass: 'notesappcs343'
    }
  });

  // Email configuration
  const mailOptions = {
    from: 'notesappcs343@gmail.com',
    to,
    subject,
    html,
  };

  try {
    // Send the email
    const info = await transporter.sendMail(mailOptions);
    console.log('Email sent:', info.messageId);
  } catch (error) {
    console.error('Error sending email:', error);
  }
};

module.exports = sendEmail;
