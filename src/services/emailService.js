const nodemailer = require("nodemailer");
const { google } = require("googleapis");
const { ConfidentialClientApplication } = require("@azure/msal-node");
const prisma = require("../lib/prisma");

/**
 * Get OAuth2 access token for Gmail
 * @param {string} refreshToken - Gmail refresh token from database
 */
async function getGmailAccessToken(refreshToken) {
  if (!refreshToken) {
    throw new Error("Gmail refresh token is required");
  }

  const oauth2Client = new google.auth.OAuth2(
    process.env.GMAIL_CLIENT_ID,
    process.env.GMAIL_CLIENT_SECRET,
    "urn:ietf:wg:oauth:2.0:oob" // Redirect URI for installed apps
  );

  oauth2Client.setCredentials({
    refresh_token: refreshToken,
  });

  const { credentials } = await oauth2Client.refreshAccessToken();
  return credentials.access_token;
}

/**
 * Get OAuth2 access token for Outlook
 * @param {string} refreshToken - Outlook refresh token from database
 */
async function getOutlookAccessToken(refreshToken) {
  if (!refreshToken) {
    throw new Error("Outlook refresh token is required");
  }

  // Note: Outlook OAuth2 refresh token flow requires additional implementation
  // This is a placeholder - you may need to implement token refresh logic using
  // Microsoft Graph API or Azure AD token endpoint
  // For now, we'll use SMTP with OAuth2, which requires the refresh token
  // to be exchanged for an access token via Microsoft's token endpoint
  
  // TODO: Implement proper Outlook refresh token exchange
  // This typically involves calling:
  // POST https://login.microsoftonline.com/common/oauth2/v2.0/token
  // with grant_type=refresh_token, client_id, client_secret, and refresh_token
  
  throw new Error(
    "Outlook OAuth2 refresh token flow needs to be implemented. For now, use SMTP with OAuth2 access tokens."
  );
}

/**
 * Send email via Gmail
 */
async function sendViaGmail(options) {
  const { fromEmail, toEmails, ccEmails, bccEmails, subject, content, isHtml, attachments, refreshToken } =
    options;

  if (!refreshToken) {
    throw new Error(
      "Gmail refresh token is required. Please add a refresh token to the email sender configuration."
    );
  }

  if (!process.env.GMAIL_CLIENT_ID || !process.env.GMAIL_CLIENT_SECRET) {
    throw new Error(
      "Gmail OAuth2 credentials not configured. Please set GMAIL_CLIENT_ID and GMAIL_CLIENT_SECRET in .env"
    );
  }

  const accessToken = await getGmailAccessToken(refreshToken);
  
  const transporter = nodemailer.createTransport({
    service: "gmail",
    auth: {
      type: "OAuth2",
      user: fromEmail,
      clientId: process.env.GMAIL_CLIENT_ID,
      clientSecret: process.env.GMAIL_CLIENT_SECRET,
      refreshToken: refreshToken,
      accessToken: accessToken,
    },
  });

  const mailOptions = {
    from: fromEmail,
    to: Array.isArray(toEmails) ? toEmails.join(", ") : toEmails,
    cc: ccEmails && Array.isArray(ccEmails) ? ccEmails.join(", ") : ccEmails,
    bcc:
      bccEmails && Array.isArray(bccEmails) ? bccEmails.join(", ") : bccEmails,
    subject: subject,
    [isHtml ? "html" : "text"]: content,
    attachments: attachments || [],
  };

  const info = await transporter.sendMail(mailOptions);
  return info;
}

/**
 * Send email via Outlook
 */
async function sendViaOutlook(options) {
  const { fromEmail, toEmails, ccEmails, bccEmails, subject, content, isHtml, attachments, refreshToken } =
    options;

  if (!refreshToken) {
    throw new Error(
      "Outlook refresh token is required. Please add a refresh token to the email sender configuration."
    );
  }

  // For Outlook, we'll use SMTP with OAuth2
  // Note: This requires getting an access token from the refresh token
  // For now, we'll use a simplified approach - in production, you may need
  // to implement proper token refresh using Microsoft Graph API
  
  // TODO: Implement proper Outlook OAuth2 token refresh
  // For now, using SMTP with basic auth is not supported without app passwords
  // Outlook OAuth2 requires access token generation from refresh token
  
  throw new Error(
    "Outlook OAuth2 implementation requires access token refresh. Please implement token refresh logic using Microsoft Graph API or Azure AD token endpoint."
  );
}

/**
 * Main reusable email sending function
 * @param {Object} options - Email options
 * @param {string} options.fromEmail - Sender email address (must be in EmailSender table)
 * @param {string|string[]} options.toEmails - Recipient email(s)
 * @param {string|string[]} [options.ccEmails] - CC email(s)
 * @param {string|string[]} [options.bccEmails] - BCC email(s)
 * @param {string} options.subject - Email subject
 * @param {string} options.content - Email content (text or HTML)
 * @param {boolean} [options.isHtml=false] - Whether content is HTML
 * @param {Array} [options.attachments] - Email attachments array
 * @returns {Promise} - Email send result
 */
async function sendEmail(options) {
  const { fromEmail, toEmails, subject, content } = options;

  if (!fromEmail || !toEmails || !subject || !content) {
    throw new Error(
      "Missing required email parameters: fromEmail, toEmails, subject, and content are required"
    );
  }

  // Normalize the fromEmail for lookup
  const normalizedFromEmail = fromEmail.toLowerCase().trim();

  // Try to find email sender by main email first
  let emailSender = await prisma.emailSender.findUnique({
    where: { email: normalizedFromEmail },
  });

  // If not found by main email, search for it in aliases
  if (!emailSender) {
    const allEmailSenders = await prisma.emailSender.findMany();
    emailSender = allEmailSenders.find((sender) => {
      // Check if the fromEmail matches any alias
      return sender.aliases && sender.aliases.some(
        (alias) => alias.toLowerCase().trim() === normalizedFromEmail
      );
    });
  }

  if (!emailSender) {
    throw new Error(
      `Email sender ${fromEmail} not found in database. Please add it first or ensure the alias is configured.`
    );
  }

  // Check if refresh token is present
  if (!emailSender.refreshToken) {
    throw new Error(
      `Email sender ${emailSender.email} is missing a refresh token. Please add a refresh token to the email sender configuration.`
    );
  }

  // Use the provided fromEmail (which could be an alias) for sending
  // But use the main email's refresh token for OAuth authentication
  const normalizedOptions = {
    ...options,
    fromEmail: normalizedFromEmail, // Use the alias or main email as provided
    refreshToken: emailSender.refreshToken, // Use main email's refresh token
  };

  // Route to appropriate provider function
  if (emailSender.emailProvider === "GMAIL") {
    return await sendViaGmail(normalizedOptions);
  } else if (emailSender.emailProvider === "OUTLOOK") {
    return await sendViaOutlook(normalizedOptions);
  } else {
    throw new Error(`Unsupported email provider: ${emailSender.emailProvider}`);
  }
}

module.exports = {
  sendEmail,
  sendViaGmail,
  sendViaOutlook,
};
