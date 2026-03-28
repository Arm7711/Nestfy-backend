import nodemailer from 'nodemailer';

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

const buildOtpHtml = (otp) => `
<div style="font-family:Arial,sans-serif;max-width:480px;margin:0 auto;padding:20px;background:#fff">
  <div style="border:1px solid #e5e5e5;border-radius:12px;padding:30px">
    <h2 style="color:#111;margin:0 0 10px">Verification Code</h2>
    <p style="color:#555;margin:0 0 24px;line-height:1.5">
      Use the code below to sign in. It expires in 10 minutes.
    </p>
    <div style="background:#111;color:#fff;padding:20px;text-align:center;font-size:30px;
                font-weight:700;letter-spacing:10px;border-radius:8px;margin:0 0 20px">
      ${otp}
    </div>
    <p style="color:#999;font-size:13px;margin:0">
      Never share this code. If you did not request it, ignore this email.
    </p>
  </div>
</div>`;

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