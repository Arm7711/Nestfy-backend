export const buildOtpHtml = (otp) => `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0"/>
  <title>Nestfy Security Code</title>
  <style>
    @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;700&family=DM+Serif+Display&display=swap');

    * { margin: 0; padding: 0; box-sizing: border-box; }

    body {
      background-color: #f2f0eb;
      font-family: 'DM Sans', Arial, sans-serif;
      padding: 40px 16px;
    }

    .wrapper {
      max-width: 520px;
      margin: 0 auto;
    }

    .card {
      background: #ffffff;
      border-radius: 16px;
      padding: 40px 40px 36px;
      border: 1px solid #e4e0d8;
    }

    .logo-block {
      display: flex;
      align-items: center;
      gap: 10px;
      margin-bottom: 32px;
    }

    .logo-icon {
      width: 36px;
      height: 36px;
      background-color: transparent !important;
      border-radius: 10px;
      display: flex;
      align-items: center;
      justify-content: center;
    }

    .logo-icon img {
      width: 100%;
      height: 100%;
      display: block;
    mix-blend-mode: multiply;
    }

    .logo-name {
      font-family: 'DM Serif Display', Arial, serif;
      font-size: 22px;
      color: #1a1a1a;
      letter-spacing: -0.3px;
    }

    .heading {
      font-family: 'DM Serif Display', Arial, serif;
      font-size: 28px;
      color: #1a1a1a;
      margin-bottom: 10px;
      letter-spacing: -0.5px;
      line-height: 1.2;
    }

    .subtext {
      font-size: 14px;
      color: #7a7570;
      line-height: 1.6;
      margin-bottom: 14px;
    }

    .otp-block {
      background: transparent;
      border-radius: 12px;
      padding: 0 28px 12px 28px;
      margin-bottom: 10px;
      display: flex;
      align-items: center;
      justify-content: space-between;
    }

    .otp-code {
      font-family: 'DM Serif Display', Arial, serif;
      font-size: 40px;
      color:rgb(0, 0, 0);
      letter-spacing: 3px;
      font-weight:600;
    }

    .otp-badge {
      background: rgba(255,255,255,0.1);
      color: #a09a94;
      font-size: 11px;
      font-weight: 500;
      padding: 4px 10px;
      border-radius: 20px;
      text-transform: uppercase;
      letter-spacing: 0.8px;
      white-space: nowrap;
    }

    .otp-meta {
      font-size: 12px;
      color: #b0aba5;
      margin-bottom: 28px;
    }

    .divider {
      border: none;
      border-top: 1px solid #e9e5de;
      margin: 28px 0;
    }

    .alert-title {
      font-size: 14px;
      font-weight: 700;
      color: #1a1a1a;
      margin-bottom: 6px;
    }

    .alert-text {
      font-size: 14px;
      color: #7a7570;
      line-height: 1.6;
    }

    .alert-text a {
      color: #1a1a1a;
      font-weight: 700;
      text-decoration: underline;
      text-underline-offset: 2px;
    }

    .footer {
      margin-top: 28px;
      padding-top: 28px;
      border-top: 1px solid #e9e5de;
      display: flex;
      align-items: flex-start;
      gap: 16px;
    }

    .footer-logo {
      width: 28px;
      height: 28px;
      background-color: transparent !important;
      border-radius: 8px;
      flex-shrink: 0;
      display: flex;
      align-items: center;
      justify-content: center;
    }

    .footer-logo img {
      width: 100%;
      height: 100%;
      display: block;
        mix-blend-mode: multiply;
    }

    .footer-address {
      font-size: 12px;
      color: #b0aba5;
      line-height: 1.8;
    }
  </style>
</head>
<body>
  <div class="wrapper">
    <div class="card">

      <!-- Logo -->
      <div class="logo-block">
        <div class="logo-icon">
          <img src="https://i.ibb.co/wN7txQCx/removebg-preview-1.png" alt="Nestfy icon" />
        </div>
      </div>

      <!-- Heading -->
      <h1 class="heading">Your security code</h1>
      <p class="subtext">
        Never share your code with anyone — Nestfy employees will never ask for it.
      </p>

      <!-- OTP -->
      <div class="otp-block">
        <span class="otp-code">${otp}</span>
      </div>
      <p class="otp-meta">${new Date().toISOString().replace('T', ' ').slice(0, 19)}</p>

      <!-- Alert -->
      <p class="alert-title">Don't recognize this?</p>
      <p class="alert-text">
        <a href="">Let us know</a> — we'll help secure and review your account.
        Otherwise, no action is required.
      </p>

      <!-- Footer -->
      <div class="footer">
        <div class="footer-logo">
          <img src="https://i.ibb.co/wN7txQCx/removebg-preview-1.png" alt="Nestfy" />
        </div>
        <p class="footer-address">
          Nestfy Inc<br />
          123 Example Street<br />
          City, Country
        </p>
      </div>

    </div>
  </div>
</body>
</html>`;
