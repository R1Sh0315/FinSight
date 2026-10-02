import nodemailer from 'nodemailer';

export const sendAlertEmail = async (toEmail: string, userName: string, alerts: string[]) => {
  if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS) {
    console.warn("EMAIL_USER or EMAIL_PASS is not set. Skipping email send.");
    console.log("Mock Email content for", toEmail, ":");
    console.log(alerts.join("\n"));
    return;
  }

  const transporter = nodemailer.createTransport({
    service: 'gmail', // You can change this if using another provider
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS,
    },
  });

  const mailOptions = {
    from: `"FinSight Portfolio Alerts" <${process.env.EMAIL_USER}>`,
    to: toEmail,
    subject: `🚨 Portfolio Alert: ${alerts.length} Thresholds Crossed`,
    html: `
      <div style="font-family: Arial, sans-serif; padding: 20px; color: #333;">
        <h2>Hello ${userName},</h2>
        <p>Your FinSight portfolio has generated some alerts based on your P&L thresholds:</p>
        <ul style="font-size: 16px;">
          ${alerts.map(alert => `<li style="margin-bottom: 10px;">${alert}</li>`).join('')}
        </ul>
        <p style="margin-top: 20px;">
          Log in to your <a href="https://fin-sight-gules.vercel.app/">FinSight Dashboard</a> to view your full portfolio.
        </p>
      </div>
    `,
  };

  try {
    await transporter.sendMail(mailOptions);
    console.log(`Alert email sent successfully to ${toEmail}`);
  } catch (error) {
    console.error(`Failed to send alert email to ${toEmail}:`, error);
  }
};
