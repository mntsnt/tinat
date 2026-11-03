import nodemailer from "nodemailer";

interface SendVerificationEmailParams {
  to: string;
  name: string;
  code: string;
  verificationLink: string;
}

/**
 * Creates a configured Nodemailer transporter.
 * Forces IPv4 (family: 4) to eliminate IPv6 network route timeouts on cloud hosting (VPS / aletcloud).
 */
function createSmtpTransporter(port: number, secure: boolean) {
  const host = process.env.SMTP_HOST || "smtp.gmail.com";
  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_PASS;

  return nodemailer.createTransport({
    host,
    port,
    secure,
    auth: { user: user || "", pass: pass || "" },
    family: 4, // Critical for fast direct IPv4 routing and preventing IPv6 timeouts
    connectionTimeout: 10000,
    greetingTimeout: 10000,
    socketTimeout: 15000,
    tls: {
      rejectUnauthorized: false,
      minVersion: "TLSv1.2",
    },
  } as any);
}

export async function sendVerificationEmail({
  to,
  name,
  code,
  verificationLink,
}: SendVerificationEmailParams): Promise<{ success: boolean; simulated: boolean }> {
  const host = process.env.SMTP_HOST || "smtp.gmail.com";
  const primaryPort = Number(process.env.SMTP_PORT) || 465;
  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_PASS;

  const recipientEmail = to.trim().toLowerCase();
  const recipientName = name.trim() || "Researcher";

  // If SMTP is not configured, warn and return simulated
  if (!user || !pass) {
    console.warn(`[Email Service] SMTP credentials not configured. Verification email to ${recipientEmail} cannot be sent.`);
    return { success: false, simulated: true };
  }

  const senderObject = {
    name: "Tinat Research Platform",
    address: user,
  };

  const html = `
    <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; max-width: 580px; margin: 0 auto; padding: 32px 24px; border: 1px solid #e2e8f0; border-radius: 12px; background-color: #ffffff;">
      <div style="text-align: center; margin-bottom: 28px;">
        <div style="display: inline-block; width: 44px; height: 44px; line-height: 44px; border-radius: 10px; background-color: #059669; color: #ffffff; font-weight: 800; font-size: 22px; margin-bottom: 16px;">T</div>
        <h1 style="color: #0f172a; margin: 0; font-size: 22px; font-weight: 700;">Welcome to Tinat, ${recipientName}!</h1>
        <p style="color: #64748b; margin-top: 8px; font-size: 14px;">Please verify your email address to activate your research account.</p>
      </div>

      <div style="background-color: #f8fafc; border: 1px solid #cbd5e1; border-radius: 10px; padding: 24px; text-align: center; margin: 24px 0;">
        <p style="color: #475569; margin: 0 0 8px 0; font-size: 13px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.5px;">Your 6-digit verification code</p>
        <div style="font-size: 38px; font-weight: 800; letter-spacing: 10px; color: #059669; font-family: monospace; margin: 12px 0;">${code}</div>
        <p style="color: #94a3b8; font-size: 12px; margin: 0;">This code is valid for 24 hours.</p>
      </div>

      <div style="text-align: center; margin: 28px 0;">
        <p style="color: #475569; font-size: 13px; margin-bottom: 14px;">Or click the button below to verify your account instantly:</p>
        <a href="${verificationLink}" style="display: inline-block; background-color: #059669; color: #ffffff; padding: 12px 32px; border-radius: 8px; text-decoration: none; font-weight: 700; font-size: 14px; box-shadow: 0 2px 4px rgba(5, 150, 105, 0.2);">Verify My Email</a>
      </div>

      <hr style="border: none; border-top: 1px solid #f1f5f9; margin: 24px 0;" />
      <p style="color: #94a3b8; font-size: 11px; text-align: center; margin: 0; line-height: 1.5;">
        If you did not register for Tinat, you can safely ignore this email.<br />
        Tinat &bull; Research Platform &bull; ${host}
      </p>
    </div>
  `;

  const mailOptions = {
    from: senderObject,
    to: recipientEmail,
    replyTo: process.env.SUPPORT_EMAIL || user,
    subject: `Verify your Tinat account (${code})`,
    text: `Welcome to Tinat, ${recipientName}!\n\nYour 6-digit verification code is: ${code}\n\nOr click here to verify automatically:\n${verificationLink}\n\nThis code expires in 24 hours.`,
    html,
  };

  // Attempt 1: Try primary port (e.g., 465 with SSL)
  try {
    const isPrimarySecure = primaryPort === 465;
    const transporter = createSmtpTransporter(primaryPort, isPrimarySecure);
    const info = await transporter.sendMail(mailOptions);
    console.log(`[Email Service] Verification email sent to ${recipientEmail} via port ${primaryPort} (MessageId: ${info.messageId})`);
    return { success: true, simulated: false };
  } catch (primaryError) {
    console.warn(`[Email Service] Primary port ${primaryPort} failed for ${recipientEmail}:`, primaryError);

    // Attempt 2: Fallback to alternative port (587 STARTTLS if 465 failed, or 465 if 587 failed)
    const fallbackPort = primaryPort === 465 ? 587 : 465;
    try {
      console.log(`[Email Service] Retrying delivery via fallback port ${fallbackPort}...`);
      const fallbackTransporter = createSmtpTransporter(fallbackPort, fallbackPort === 465);
      const fallbackInfo = await fallbackTransporter.sendMail(mailOptions);
      console.log(`[Email Service] Verification email sent to ${recipientEmail} via fallback port ${fallbackPort} (MessageId: ${fallbackInfo.messageId})`);
      return { success: true, simulated: false };
    } catch (fallbackError) {
      console.error(`[Email Service] Both primary and fallback SMTP delivery failed for ${recipientEmail}:`, fallbackError);
      throw new Error(`Failed to deliver verification email to ${recipientEmail}: ${fallbackError instanceof Error ? fallbackError.message : "SMTP transport error"}`);
    }
  }
}
