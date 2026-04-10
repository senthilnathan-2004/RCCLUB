// ============================================
// EMAIL SERVICE
// ============================================

import nodemailer from "nodemailer"
import config from "../config/config.js"
import { logger } from "./logger.js"

// Create transporter
const createTransporter = () => {
  return nodemailer.createTransport({
    host: config.smtpHost,
    port: config.smtpPort,
    secure: config.smtpPort === 465,
    auth: {
      user: config.smtpUser,
      pass: config.smtpPass,
    },
  })
}

// Send email
export const sendEmail = async ({ to, subject, html, text }) => {
  try {
    const transporter = createTransporter()

    const mailOptions = {
      from: `Rotaract Club <${config.fromEmail}>`,
      to,
      subject,
      html,
      text,
    }

    const info = await transporter.sendMail(mailOptions)
    logger.info(`Email sent: ${info.messageId}`)
    return { success: true, messageId: info.messageId }
  } catch (error) {
    logger.error(`Email error: ${error.message}`)
    return { success: false, error: error.message }
  }
}

// Email templates
export const emailTemplates = {
  welcome: (name, memberId) => ({
    subject: "Welcome to Rotaract Club - Your Login Credentials",
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h1 style="color: #0066cc;">Welcome to Rotaract Club!</h1>
        <p>Dear ${name},</p>
        <p>Welcome to our Rotaract family! Your membership has been confirmed.</p>
        <div style="background: #f5f5f5; padding: 20px; border-radius: 8px; margin: 20px 0;">
          <h2 style="color: #0066cc; margin-top: 0;">Your Login Credentials</h2>
          <p><strong>Member ID:</strong> <span style="font-family: monospace; font-size: 18px; color: #0066cc;">${memberId}</span></p>
        </div>
        <p><strong>How to Login:</strong></p>
        <ol>
          <li>Go to the member login page</li>
          <li>Enter your <strong>EMAIL</strong>  in the login field</li>
          <li>Enter your <strong>MEMBER ID(PASSWORD)</strong> in the password field</li>
          <li>Click "Sign In"</li>
        </ol>
        <p style="color: #dc3545;"><strong>Important:</strong> Please change your password after first login for security.</p>
        <p>We're excited to have you join us in our mission of service above self.</p>
        <br>
        <p>Best regards,<br>Rotaract Club of AIHT</p>
      </div>
    `,
    text: `Welcome to Rotaract Club! Dear ${name}, Your Member ID: ${memberId}. Use your Member ID(PASSWORD) to login.`,
  }),

  expenseSubmitted: (name, amount, event) => ({
    subject: "Expense Submitted Successfully",
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #0066cc;">Expense Submitted</h2>
        <p>Dear ${name},</p>
        <p>Your expense has been submitted successfully.</p>
        <p><strong>Amount:</strong> ₹${amount}</p>
        <p><strong>Event:</strong> ${event}</p>
        <p><strong>Status:</strong> Pending Approval</p>
        <p>You will be notified once it's reviewed.</p>
      </div>
    `,
    text: `Expense Submitted - Amount: ₹${amount}, Event: ${event}`,
  }),

  expenseApproved: (name, amount, event) => ({
    subject: "Expense Approved",
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #28a745;">Expense Approved ✓</h2>
        <p>Dear ${name},</p>
        <p>Your expense has been approved!</p>
        <p><strong>Amount:</strong> ₹${amount}</p>
        <p><strong>Event:</strong> ${event}</p>
      </div>
    `,
    text: `Expense Approved - Amount: ₹${amount}, Event: ${event}`,
  }),

  expenseRejected: (name, amount, event, reason) => ({
    subject: "Expense Rejected",
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #dc3545;">Expense Rejected</h2>
        <p>Dear ${name},</p>
        <p>Unfortunately, your expense has been rejected.</p>
        <p><strong>Amount:</strong> ₹${amount}</p>
        <p><strong>Event:</strong> ${event}</p>
        <p><strong>Reason:</strong> ${reason}</p>
      </div>
    `,
    text: `Expense Rejected - Amount: ₹${amount}, Reason: ${reason}`,
  }),

  passwordReset: (name, resetUrl) => ({
    subject: "Password Reset Request",
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #0066cc;">Password Reset</h2>
        <p>Dear ${name},</p>
        <p>You requested a password reset. Click the link below:</p>
        <a href="${resetUrl}" style="display: inline-block; padding: 10px 20px; background: #0066cc; color: white; text-decoration: none; border-radius: 5px;">Reset Password</a>
        <p>This link expires in 1 hour.</p>
        <p>If you didn't request this, please ignore this email.</p>
      </div>
    `,
    text: `Password Reset - Visit: ${resetUrl}`,
  }),

  newExpenseAlert: (treasurerName, memberName, amount, event) => ({
    subject: "New Expense Submission - Action Required",
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #ff9800;">New Expense Submission</h2>
        <p>Dear ${treasurerName},</p>
        <p>A new expense has been submitted and requires your review.</p>
        <p><strong>Submitted by:</strong> ${memberName}</p>
        <p><strong>Amount:</strong> ₹${amount}</p>
        <p><strong>Event:</strong> ${event}</p>
        <p>Please login to review and approve/reject this expense.</p>
      </div>
    `,
    text: `New Expense from ${memberName} - Amount: ₹${amount}`,
  }),

  newEventNotification: (memberName, eventName, startDate, category, eventId) => {
    const formattedDate = new Date(startDate).toLocaleDateString('en-IN', {
      weekday: 'short', year: 'numeric', month: 'long', day: 'numeric',
      hour: '2-digit', minute: '2-digit'
    })
    const eventUrl = eventId
      ? `${config.frontendUrl}/event-link/${eventId}`
      : `${config.frontendUrl}/events`

    return {
      subject: `New Event Announcement: ${eventName}`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; border: 1px solid #eaeaea; border-radius: 8px; overflow: hidden;">
          <div style="background: #0066cc; color: white; padding: 20px; text-align: center;">
            <h2 style="margin: 0;">New Event Announcement! 🎉</h2>
          </div>
          <div style="padding: 20px;">
            <p>Dear ${memberName || 'Member'},</p>
            <p>We are excited to announce a new ${category || 'Rotaract'} event: <strong>${eventName}</strong>.</p>
            
            <div style="background: #f8f9fa; padding: 15px; border-left: 4px solid #0066cc; margin: 20px 0;">
              <p style="margin: 5px 0;"><strong>📅 Date & Time:</strong> ${formattedDate}</p>
              ${category ? `<p style="margin: 5px 0;"><strong>🏷️ Category:</strong> <span style="text-transform: capitalize;">${category.replace('_', ' ')}</span></p>` : ''}
            </div>
            
            <p>Please mark your calendars and join us to make this event a grand success! You can view more details on the club portal.</p>
            
            <div style="text-align: center; margin-top: 30px;">
              <a href="${eventUrl}" style="display: inline-block; padding: 12px 24px; background: #0066cc; color: white; text-decoration: none; border-radius: 5px; font-weight: bold;">View Event Details</a>
            </div>
          </div>
          <div style="background: #f5f5f5; padding: 15px; text-align: center; color: #666; font-size: 12px;">
            <p>Rotaract Club of AIHT<br>Service Above Self</p>
          </div>
        </div>
      `,
      text: `New Event Announcement: ${eventName} on ${formattedDate}. View details at ${eventUrl}`,
    }
  },
}

export default { sendEmail, emailTemplates }
