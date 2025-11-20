import nodemailer from 'nodemailer';

const sendEmail = async ({ to, subject, html ,attachments}) => {
  const transporter = nodemailer.createTransport({
    service:  "gmail",
    secure: true,
    port:  465,
    auth: {
      user:  process.env.EMAIL,
      pass:  process.env.PASSWORD
    },
    tls: {
    rejectUnauthorized: false,
  }
  });

  await transporter.sendMail({
    from: process.env.MAIL_FROM,
    to,
    subject,
    html,
    attachments
  });
};

export default sendEmail;
