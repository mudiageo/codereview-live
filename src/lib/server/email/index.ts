import nodemailer from 'nodemailer';
import { Resend } from 'resend';
import { config } from '../config';

const nodemailerTransporter = nodemailer.createTransport({
  host: config.email.smtp.host,
  port: config.email.smtp.port,
  secure: config.email.smtp.port === 465,
  auth: {
    user: config.email.smtp.user,
    pass: config.email.smtp.password,
  },
});

// Only create Resend client if API key is provided
const resendClient = config.email.resend.apiKey ? new Resend(config.email.resend.apiKey) : null;

export interface EmailOptions {
  to: string;
  subject: string;
  html: string;
  text?: string;
}

export async function sendEmail(options: EmailOptions) {
  if (config.email.provider === 'resend') {
    if (!resendClient) {
      throw new Error('Resend API key not configured');
    }
    return await resendClient.emails.send({
      from: config.email.smtp.from,
      to: options.to,
      subject: options.subject,
      html: options.html,
      text: options.text,
    });
  } else {
    return await nodemailerTransporter.sendMail({
      from: config.email.smtp.from,
      to: options.to,
      subject: options.subject,
      html: options.html,
      text: options.text,
    });
  }
}

export async function sendVerificationEmail(email: string, token: string) {
  const verificationUrl = `${config.app.url}/verify-email?token=${token}`;

  await sendEmail({
    to: email,
    subject: 'Verify your email - CodeReview.live',
    html: `
      <h1>Verify Your Email</h1>
      <p>Click the link below to verify your email address:</p>
      <a href="${verificationUrl}">${verificationUrl}</a>
      <p>This link will expire in 24 hours.</p>
    `,
    text: `Verify your email: ${verificationUrl}`,
  });
}

export async function sendPasswordResetEmail(email: string, token: string) {
  const resetUrl = `${config.app.url}/reset-password?token=${token}`;

  await sendEmail({
    to: email,
    subject: 'Reset your password - CodeReview.live',
    html: `
      <h1>Reset Your Password</h1>
      <p>Click the link below to reset your password:</p>
      <a href="${resetUrl}">${resetUrl}</a>
      <p>This link will expire in 1 hour.</p>
      <p>If you didn't request this, please ignore this email.</p>
    `,
    text: `Reset your password: ${resetUrl}`,
  });
}

export async function sendTeamInviteEmail(
  email: string,
  inviterName: string,
  projectName: string,
  inviteToken: string
) {
  const inviteUrl = `${config.app.url}/team/accept?token=${inviteToken}`;

  await sendEmail({
    to: email,
    subject: `${inviterName} invited you to join ${projectName}`,
    html: `
      <h1>You've Been Invited!</h1>
      <p>${inviterName} has invited you to join the "${projectName}" project on CodeReview.live.</p>
      <a href="${inviteUrl}">Accept Invitation</a>
      <p>This invitation will expire in 7 days.</p>
    `,
    text: `${inviterName} invited you to join ${projectName}. Accept: ${inviteUrl}`,
  });
}

export async function sendCommentNotificationEmail(
  email: string,
  reviewTitle: string,
  commenterName: string,
  reviewUrl: string
) {
  await sendEmail({
    to: email,
    subject: `New comment on "${reviewTitle}"`,
    html: `
      <h1>New Comment</h1>
      <p>${commenterName} commented on your review "${reviewTitle}".</p>
      <a href="${reviewUrl}">View Comment</a>
    `,
    text: `${commenterName} commented on "${reviewTitle}". View: ${reviewUrl}`,
  });
}