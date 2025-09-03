import nodemailer from "nodemailer";

export async function sendEmail(to: string, subject: string, body: string) {
  const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST!,
    port: Number(process.env.SMTP_PORT || 587),
    secure: false,
    auth: { user: process.env.SMTP_USER!, pass: process.env.SMTP_PASS! }
  });

  const info = await transporter.sendMail({
    from: process.env.EMAIL_FROM!,
    to,
    subject,
    text: body,
    html: `<pre style="font:14px ui-monospace, SFMono-Regular, Menlo, monospace">${body}</pre>`
  });

  return { messageId: info.messageId };
}
