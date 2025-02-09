const nodemailer = require('nodemailer');
const postmark = require('postmark');
const pug = require('pug');
const htmlToText = require('html-to-text');

module.exports = class Email {
  constructor(user, url) {
    this.to = user.email;
    this.firstName = user.name.split(' ')[0];
    this.url = url;
    this.from = `Diego Cerqueira <${process.env.EMAIL_FROM}>`;
  }

  newTransport() {
    if (process.env.NODE_ENV === 'production') {
      // Send an email with postmark production
      return new postmark.ServerClient(process.env.POSTMARK_TOKEN);
    }

    return nodemailer.createTransport({
      host: process.env.EMAIL_HOST,
      port: process.env.EMAIL_PORT,
      auth: {
        user: process.env.EMAIL_USERNAME,
        pass: process.env.EMAIL_PASSWORD,
      },
    });
  }

  async sendWelcome() {
    await this.send('welcome', 'Welcome :)');
  }

  async sendResetPassword() {
    await this.send('passwordReset', 'You requested a password reset:)');
  }

  async send(template, subject) {
    const html = pug.renderFile(`${__dirname}/../views/email/${template}.pug`, {
      firstName: this.firstName,
      url: this.url,
      subject,
    });

    // Send an email:
    // const client = new postmark.ServerClient(process.env.POSTMARK_TOKEN);

    if (process.env.NODE_ENV === 'production') {
      const mail = await this.newTransport().sendEmail({
        From: `${this.from}`,
        // To: `${this.to}`, // will only work after account approval from Postmark
        To: `test@blackhole.postmarkapp.com`,
        Subject: subject,
        HtmlBody: html, // Aqui usamos o HTML gerado dinamicamente
        TextBody: htmlToText.convert(html),
      });
    } else {
      const mailOptions = {
        from: this.from,
        to: this.to,
        subject,
        html,
        text: htmlToText.convert(html),
      };

      await this.newTransport().sendMail(mailOptions);
    }
  }
};
