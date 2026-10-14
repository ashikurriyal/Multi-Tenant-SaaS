import nodemailer from 'nodemailer';
import config from '../config';

const { host, port, user, pass } = config.mail;
const smtpConfigured = Boolean(host && user && pass);

/**
 * SMTP (Mailtrap in development) when configured. Without credentials in development,
 * messages are rendered but not delivered (jsonTransport), so the outbox flow still runs.
 * Production refuses to start without SMTP (see config).
 */
export const mailer = smtpConfigured
  ? nodemailer.createTransport({ host, port, secure: port === 465, auth: { user, pass } })
  : nodemailer.createTransport({ jsonTransport: true });

export const mailDelivery = smtpConfigured ? `smtp (${host})` : 'not delivered (no SMTP config)';
