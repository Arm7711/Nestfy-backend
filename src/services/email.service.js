import nodemailer from 'nodemailer';
import { buildOtpHtml } from './email.template.js';

let transporter;

const getTransporter = () => {
  if (transporter) return transporter;

  transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: Number(process.env.SMTP_PORT) || 587,
    secure: Number(process.env.SMTP_PORT) === 465,
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS,
    },
  });

  return transporter;
};

export const sendOtpEmail = async (email, otp) => {
  if (!email || !otp) throw new Error('Invalid email or OTP');

  return getTransporter().sendMail({
    from: process.env.SMTP_FROM || '"Nestfy" <noreply@nestfy.com>',
    to: email,
    subject: 'Your sign-in code — Nestfy',
    html: buildOtpHtml(otp),
    text: `Your sign-in code: ${otp}. Expires in 10 minutes.`,
  });
};

export default getTransporter;