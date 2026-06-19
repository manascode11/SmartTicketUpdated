import nodemailer from "nodemailer";

export const sendMail = async (to, subject, text) => {
  try {
    const transporter = nodemailer.createTransport({
      host: process.env.MAILTRAP_SMTP_HOST,
      port: Number(process.env.MAILTRAP_SMTP_PORT || 2525),
      secure: false,
      auth: {
        user: process.env.MAILTRAP_SMTP_USER,
        pass: process.env.MAILTRAP_SMTP_PASS,
      },
    });

    const info = await transporter.sendMail({
      from: '"Inngest TMS" <noreply@tms.com>',
      to,
      subject,
      text,
    });

    console.log("✉️ Message sent successfully:", info.messageId);
    return info;
  } catch (error) {
    console.error("❌ Mail utility error:", error.message);
    throw error;
  }
};