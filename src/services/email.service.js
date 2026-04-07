import nodemailer from 'nodemailer';
import {buildOtpHtml} from "./email.template.js";

let _transporter = null;

const getTransporter = () => {
  if (!_transporter) {
    _transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: Number(process.env.SMTP_PORT) || 587,
      secure: Number(process.env.SMTP_PORT) === 465,
      auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS },
    });
  }
  return _transporter;
};

export const sendOtpEmail = async (email, otp) => {
  await getTransporter().sendMail({
    from: process.env.SMTP_FROM || '"Nestfy" <noreply@nestfy.com>',
    to: email,
    subject: 'Your sign-in code — Nestfy',
    html: buildOtpHtml(otp),
    text: `Your sign-in code: ${otp}\n\nExpires in 10 minutes. Do not share this code.`,
  });
};

export default getTransporter;