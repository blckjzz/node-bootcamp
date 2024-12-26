const nodemailer = require('nodemailer');

exports.sendMail = async (options) => {
  // 1) create a transporter
  const transporter = nodemailer.createTransport({
    host: process.env.EMAIL_HOST,
    port: process.env.EMAIL_PORT,
    auth: {
      user: process.env.EMAIL_USERNAME,
      pass: process.env.EMAIL_PASSWORD,
    },
  });
  // 2) email opptions
  const emailOptions = {
    from: 'Diego Cerqueira <hello@diegocerqueira.com.br>',
    to: options.email,
    subject: options.subject,
    // text: options.text,
    html: options.html,
  };
  await transporter.sendMail(emailOptions);
};
