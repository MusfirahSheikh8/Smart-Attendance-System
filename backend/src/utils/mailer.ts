import nodemailer from 'nodemailer';
import { config } from '../config/env';
import { logger } from './logger';

const transporter = nodemailer.createTransport({
  host: config.smtp.host,
  port: config.smtp.port,
  secure: config.smtp.port === 465, // true for 465, false for other ports
  auth: {
    user: config.smtp.user,
    pass: config.smtp.pass,
  },
});

export async function sendEmail({ to, subject, text, html }: { to: string, subject: string, text: string, html?: string }): Promise<boolean> {
  // If SMTP is not configured properly in dev, just mock it
  if (!config.smtp.user || !config.smtp.pass) {
    logger.warn(`SMTP not configured. Mock Email to ${to}: [${subject}] - ${text}`);
    return true; // Fake success
  }

  try {
    const info = await transporter.sendMail({
      from: config.smtp.from,
      to,
      subject,
      text,
      html: html || text,
    });
    logger.info(`Email sent to ${to}: ${info.messageId}`);
    return true;
  } catch (error) {
    logger.error(`Error sending email to ${to}:`, error);
    return false;
  }
}
