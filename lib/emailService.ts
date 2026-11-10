import nodemailer from "nodemailer";

interface SendVerificationEmailParams {
  to: string;
  name: string;
  code: string;
  verificationLink: string;
}

export interface SendProjectInvitationEmailParams {
  to: string;
  inviterName: string;
  projectTitle: string;
  role: string;
  inviteLink: string;
  customMessage?: string | null;
}

export interface SendCollectorInvitationEmailParams {
  to: string;
  collectorName?: string;
  inviterName: string;
  studyTitle: string;
  dashboardLink: string;
}

/**
 * Creates a configured Nodemailer transporter.
 * Forces IPv4 (family: 4) to eliminate IPv6 network route timeouts on cloud hosting (VPS / aletcloud).
 */
function createSmtpTransporter(port: number, secure: boolean) {
  const host = (process.env.SMTP_HOST || "smtp.gmail.com").trim();
  const user = (process.env.SMTP_USER || "iammintesnot@gmail.com").trim();
  const pass = (process.env.SMTP_PASS || "cympjvsszaszmerz").trim();

  return nodemailer.createTransport({
    host,
    port,
    secure,
    auth: { user, pass },
    family: 4, // Critical for fast direct IPv4 routing and preventing IPv6 timeouts
    connectionTimeout: 10000,
    greetingTimeout: 10000,
    socketTimeout: 15000,
    requireTLS: !secure,
    tls: {
      rejectUnauthorized: false,
      minVersion: "TLSv1.2",
    },
  } as any);
}

/**
 * Core delivery pipeline with automatic primary port (465) to fallback port (587) retry.
 */
async function deliverEmail(mailOptions: {
  to: string;
  subject: string;
  text: string;
  html: string;
}): Promise<{ success: boolean; simulated: boolean }> {
  const primaryPort = Number(process.env.SMTP_PORT) || 465;
  const user = (process.env.SMTP_USER || "iammintesnot@gmail.com").trim();
  const pass = (process.env.SMTP_PASS || "cympjvsszaszmerz").trim();
  const supportEmail = (process.env.SUPPORT_EMAIL || "contact.tinatapp@gmail.com").trim();

  if (!user || !pass) {
    console.warn(`[Email Service] SMTP credentials not configured. Email to ${mailOptions.to} simulated.`);
    return { success: false, simulated: true };
  }

  const senderObject = {
    name: "Tinat Research Platform",
    address: user,
  };

  const fullOptions = {
    ...mailOptions,
    from: senderObject,
    replyTo: supportEmail,
  };

  // Attempt 1: Try primary port (465 SSL)
  try {
    const isPrimarySecure = primaryPort === 465;
    const transporter = createSmtpTransporter(primaryPort, isPrimarySecure);
    const info = await transporter.sendMail(fullOptions);
    console.log(`[Email Service] Email "${mailOptions.subject}" delivered to ${mailOptions.to} via port ${primaryPort} (${info.messageId})`);
    return { success: true, simulated: false };
  } catch (primaryError) {
    console.warn(`[Email Service] Primary port ${primaryPort} delivery failed for ${mailOptions.to}:`, primaryError);

    // Attempt 2: Fallback to alternative port (587 STARTTLS)
    const fallbackPort = primaryPort === 465 ? 587 : 465;
    try {
      console.log(`[Email Service] Retrying delivery via fallback port ${fallbackPort}...`);
      const fallbackTransporter = createSmtpTransporter(fallbackPort, fallbackPort === 465);
      const fallbackInfo = await fallbackTransporter.sendMail(fullOptions);
      console.log(`[Email Service] Email "${mailOptions.subject}" delivered to ${mailOptions.to} via fallback port ${fallbackPort} (${fallbackInfo.messageId})`);
      return { success: true, simulated: false };
    } catch (fallbackError) {
      console.error(`[Email Service] Both primary and fallback delivery failed for ${mailOptions.to}:`, fallbackError);
      throw new Error(`Failed to deliver email to ${mailOptions.to}: ${fallbackError instanceof Error ? fallbackError.message : "SMTP transport error"}`);
    }
  }
}

/**
 * 1. User Email Verification Email
 */
export async function sendVerificationEmail({
  to,
  name,
  code,
  verificationLink,
}: SendVerificationEmailParams): Promise<{ success: boolean; simulated: boolean }> {
  const recipientEmail = to.trim().toLowerCase();
  const recipientName = name.trim() || "Researcher";

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
        Tinat &bull; Research Platform
      </p>
    </div>
  `;

  return deliverEmail({
    to: recipientEmail,
    subject: `Verify your Tinat account (${code})`,
    text: `Welcome to Tinat, ${recipientName}!\n\nYour 6-digit verification code is: ${code}\n\nOr click here to verify automatically:\n${verificationLink}\n\nThis code expires in 24 hours.`,
    html,
  });
}

/**
 * 2. Research Project Collaborator Invitation Email
 */
export async function sendProjectInvitationEmail({
  to,
  inviterName,
  projectTitle,
  role,
  inviteLink,
  customMessage,
}: SendProjectInvitationEmailParams): Promise<{ success: boolean; simulated: boolean }> {
  const recipientEmail = to.trim().toLowerCase();
  const readableRole = role.replace(/_/g, " ");

  const html = `
    <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; max-width: 580px; margin: 0 auto; padding: 32px 24px; border: 1px solid #e2e8f0; border-radius: 12px; background-color: #ffffff;">
      <div style="text-align: center; margin-bottom: 24px;">
        <div style="display: inline-block; width: 44px; height: 44px; line-height: 44px; border-radius: 10px; background-color: #059669; color: #ffffff; font-weight: 800; font-size: 22px; margin-bottom: 16px;">T</div>
        <h1 style="color: #0f172a; margin: 0; font-size: 22px; font-weight: 700;">Collaboration Invitation</h1>
        <p style="color: #64748b; margin-top: 8px; font-size: 15px;">
          <strong>${inviterName}</strong> has invited you to collaborate on <strong>${projectTitle}</strong>.
        </p>
      </div>

      <div style="background-color: #f8fafc; border: 1px solid #e2e8f0; border-radius: 10px; padding: 20px; margin: 24px 0;">
        <div style="margin-bottom: 12px;">
          <span style="font-size: 11px; font-weight: 700; color: #94a3b8; text-transform: uppercase; letter-spacing: 0.5px;">Project</span>
          <div style="font-size: 16px; font-weight: 700; color: #0f172a; margin-top: 2px;">${projectTitle}</div>
        </div>
        <div style="margin-bottom: 12px;">
          <span style="font-size: 11px; font-weight: 700; color: #94a3b8; text-transform: uppercase; letter-spacing: 0.5px;">Assigned Role</span>
          <div style="font-size: 14px; font-weight: 600; color: #059669; margin-top: 2px;">${readableRole}</div>
        </div>
        ${
          customMessage
            ? `
          <div style="border-top: 1px dashed #cbd5e1; padding-top: 12px; margin-top: 12px;">
            <span style="font-size: 11px; font-weight: 700; color: #94a3b8; text-transform: uppercase; letter-spacing: 0.5px;">Message from ${inviterName}</span>
            <p style="color: #334155; font-size: 13px; font-style: italic; margin: 4px 0 0 0;">&ldquo;${customMessage}&rdquo;</p>
          </div>
        `
            : ""
        }
      </div>

      <div style="text-align: center; margin: 28px 0;">
        <p style="color: #475569; font-size: 13px; margin-bottom: 16px;">
          Join the research workspace to access milestone boards, shared files, team discussions, and study protocols:
        </p>
        <a href="${inviteLink}" style="display: inline-block; background-color: #059669; color: #ffffff; padding: 12px 32px; border-radius: 8px; text-decoration: none; font-weight: 700; font-size: 14px; box-shadow: 0 2px 4px rgba(5, 150, 105, 0.2);">Accept Invitation & Join Project</a>
      </div>

      <p style="color: #94a3b8; font-size: 12px; text-align: center; margin: 0 0 16px 0;">
        This invitation link is valid for 14 days. If you don't have a Tinat account yet, you will be prompted to create one.
      </p>

      <hr style="border: none; border-top: 1px solid #f1f5f9; margin: 24px 0;" />
      <p style="color: #94a3b8; font-size: 11px; text-align: center; margin: 0;">
        Tinat &bull; Collaborative Health Research Ecosystem
      </p>
    </div>
  `;

  return deliverEmail({
    to: recipientEmail,
    subject: `${inviterName} invited you to join "${projectTitle}" on Tinat`,
    text: `${inviterName} has invited you to collaborate on "${projectTitle}" as ${readableRole}.\n\nClick the link below to accept the invitation and join the workspace:\n${inviteLink}\n\nThis invitation link expires in 14 days.`,
    html,
  });
}

/**
 * 3. Study Data Collector Invitation Email
 */
export async function sendCollectorInvitationEmail({
  to,
  collectorName,
  inviterName,
  studyTitle,
  dashboardLink,
}: SendCollectorInvitationEmailParams): Promise<{ success: boolean; simulated: boolean }> {
  const recipientEmail = to.trim().toLowerCase();
  const name = collectorName || "Data Collector";

  const html = `
    <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; max-width: 580px; margin: 0 auto; padding: 32px 24px; border: 1px solid #e2e8f0; border-radius: 12px; background-color: #ffffff;">
      <div style="text-align: center; margin-bottom: 24px;">
        <div style="display: inline-block; width: 44px; height: 44px; line-height: 44px; border-radius: 10px; background-color: #059669; color: #ffffff; font-weight: 800; font-size: 22px; margin-bottom: 16px;">T</div>
        <h1 style="color: #0f172a; margin: 0; font-size: 22px; font-weight: 700;">Field Data Collection Assignment</h1>
        <p style="color: #64748b; margin-top: 8px; font-size: 15px;">Hello ${name}, you have been assigned to a research study on Tinat.</p>
      </div>

      <div style="background-color: #f8fafc; border: 1px solid #e2e8f0; border-radius: 10px; padding: 20px; margin: 24px 0;">
        <div style="margin-bottom: 12px;">
          <span style="font-size: 11px; font-weight: 700; color: #94a3b8; text-transform: uppercase; letter-spacing: 0.5px;">Study</span>
          <div style="font-size: 16px; font-weight: 700; color: #0f172a; margin-top: 2px;">${studyTitle}</div>
        </div>
        <div>
          <span style="font-size: 11px; font-weight: 700; color: #94a3b8; text-transform: uppercase; letter-spacing: 0.5px;">Principal Investigator / Inviter</span>
          <div style="font-size: 14px; font-weight: 600; color: #334155; margin-top: 2px;">${inviterName}</div>
        </div>
      </div>

      <div style="text-align: center; margin: 28px 0;">
        <a href="${dashboardLink}" style="display: inline-block; background-color: #059669; color: #ffffff; padding: 12px 32px; border-radius: 8px; text-decoration: none; font-weight: 700; font-size: 14px; box-shadow: 0 2px 4px rgba(5, 150, 105, 0.2);">Open Field Enumerator Dashboard</a>
      </div>

      <hr style="border: none; border-top: 1px solid #f1f5f9; margin: 24px 0;" />
      <p style="color: #94a3b8; font-size: 11px; text-align: center; margin: 0;">
        Tinat &bull; Collaborative Health Research Ecosystem
      </p>
    </div>
  `;

  return deliverEmail({
    to: recipientEmail,
    subject: `New Data Collection Assignment: "${studyTitle}"`,
    text: `Hello ${name},\n\n${inviterName} has assigned you as a Field Data Collector for "${studyTitle}".\n\nAccess your Field Collector Dashboard here:\n${dashboardLink}`,
    html,
  });
}

/**
 * 4. Collector Application Submitted Email (sent to Researcher)
 */
export async function sendCollectorApplicationSubmittedEmail({
  to,
  researcherName,
  applicantName,
  applicantEmail,
  studyTitle,
  notes,
  reviewLink,
}: {
  to: string;
  researcherName: string;
  applicantName: string;
  applicantEmail: string;
  studyTitle: string;
  notes?: string | null;
  reviewLink: string;
}): Promise<{ success: boolean; simulated: boolean }> {
  const recipientEmail = to.trim().toLowerCase();

  const html = `
    <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; max-width: 580px; margin: 0 auto; padding: 32px 24px; border: 1px solid #e2e8f0; border-radius: 12px; background-color: #ffffff;">
      <div style="text-align: center; margin-bottom: 24px;">
        <div style="display: inline-block; width: 44px; height: 44px; line-height: 44px; border-radius: 10px; background-color: #059669; color: #ffffff; font-weight: 800; font-size: 22px; margin-bottom: 16px;">T</div>
        <h1 style="color: #0f172a; margin: 0; font-size: 22px; font-weight: 700;">New Field Collector Application</h1>
        <p style="color: #64748b; margin-top: 8px; font-size: 15px;">Hello ${researcherName}, a participant has applied to collect data for your study.</p>
      </div>

      <div style="background-color: #f8fafc; border: 1px solid #e2e8f0; border-radius: 10px; padding: 20px; margin: 24px 0;">
        <div style="margin-bottom: 12px;">
          <span style="font-size: 11px; font-weight: 700; color: #94a3b8; text-transform: uppercase;">Study</span>
          <div style="font-size: 16px; font-weight: 700; color: #0f172a; margin-top: 2px;">${studyTitle}</div>
        </div>
        <div style="margin-bottom: 12px;">
          <span style="font-size: 11px; font-weight: 700; color: #94a3b8; text-transform: uppercase;">Applicant</span>
          <div style="font-size: 14px; font-weight: 600; color: #334155; margin-top: 2px;">${applicantName} (${applicantEmail})</div>
        </div>
        ${notes ? `
        <div>
          <span style="font-size: 11px; font-weight: 700; color: #94a3b8; text-transform: uppercase;">Applicant Pitch / Experience</span>
          <div style="font-size: 13px; color: #475569; margin-top: 4px; font-style: italic;">"${notes}"</div>
        </div>
        ` : ''}
      </div>

      <div style="text-align: center; margin: 28px 0;">
        <a href="${reviewLink}" style="display: inline-block; background-color: #059669; color: #ffffff; padding: 12px 32px; border-radius: 8px; text-decoration: none; font-weight: 700; font-size: 14px; box-shadow: 0 2px 4px rgba(5, 150, 105, 0.2);">Review & Approve Collector</a>
      </div>

      <hr style="border: none; border-top: 1px solid #f1f5f9; margin: 24px 0;" />
      <p style="color: #94a3b8; font-size: 11px; text-align: center; margin: 0;">
        Tinat &bull; Collaborative Health Research Ecosystem
      </p>
    </div>
  `;

  return deliverEmail({
    to: recipientEmail,
    subject: `[Collector Application] ${applicantName} applied for "${studyTitle}"`,
    text: `Hello ${researcherName},\n\n${applicantName} (${applicantEmail}) has applied to become a field data collector for your study "${studyTitle}".\n\nReview the application here:\n${reviewLink}`,
    html,
  });
}

/**
 * 5. Collector Application Decision Email (sent to Applicant)
 */
export async function sendCollectorApplicationStatusEmail({
  to,
  applicantName,
  studyTitle,
  status,
  dashboardLink,
}: {
  to: string;
  applicantName: string;
  studyTitle: string;
  status: 'APPROVED' | 'DECLINED';
  dashboardLink: string;
}): Promise<{ success: boolean; simulated: boolean }> {
  const recipientEmail = to.trim().toLowerCase();
  const isApproved = status === 'APPROVED';

  const html = `
    <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; max-width: 580px; margin: 0 auto; padding: 32px 24px; border: 1px solid #e2e8f0; border-radius: 12px; background-color: #ffffff;">
      <div style="text-align: center; margin-bottom: 24px;">
        <div style="display: inline-block; width: 44px; height: 44px; line-height: 44px; border-radius: 10px; background-color: ${isApproved ? '#059669' : '#64748b'}; color: #ffffff; font-weight: 800; font-size: 22px; margin-bottom: 16px;">T</div>
        <h1 style="color: #0f172a; margin: 0; font-size: 22px; font-weight: 700;">
          ${isApproved ? 'Collector Application Approved! 🎉' : 'Collector Application Update'}
        </h1>
        <p style="color: #64748b; margin-top: 8px; font-size: 15px;">Hello ${applicantName},</p>
      </div>

      <div style="background-color: #f8fafc; border: 1px solid #e2e8f0; border-radius: 10px; padding: 20px; margin: 24px 0;">
        <div style="margin-bottom: 8px;">
          <span style="font-size: 11px; font-weight: 700; color: #94a3b8; text-transform: uppercase;">Study</span>
          <div style="font-size: 16px; font-weight: 700; color: #0f172a; margin-top: 2px;">${studyTitle}</div>
        </div>
        <p style="font-size: 14px; color: #334155; margin: 12px 0 0 0; line-height: 1.5;">
          ${isApproved 
            ? 'The principal investigator has approved your application! You are now an authorized field data collector for this study.' 
            : 'Thank you for your interest in collecting data for this study. The research team was unable to approve your application at this time.'}
        </p>
      </div>

      ${isApproved ? `
      <div style="text-align: center; margin: 28px 0;">
        <a href="${dashboardLink}" style="display: inline-block; background-color: #059669; color: #ffffff; padding: 12px 32px; border-radius: 8px; text-decoration: none; font-weight: 700; font-size: 14px; box-shadow: 0 2px 4px rgba(5, 150, 105, 0.2);">Open Field Collection Dashboard</a>
      </div>
      ` : ''}

      <hr style="border: none; border-top: 1px solid #f1f5f9; margin: 24px 0;" />
      <p style="color: #94a3b8; font-size: 11px; text-align: center; margin: 0;">
        Tinat &bull; Collaborative Health Research Ecosystem
      </p>
    </div>
  `;

  return deliverEmail({
    to: recipientEmail,
    subject: isApproved 
      ? `Approved: You are now a Data Collector for "${studyTitle}"`
      : `Update on your application for "${studyTitle}"`,
    text: isApproved
      ? `Hello ${applicantName},\n\nCongratulations! Your application to collect data for "${studyTitle}" has been approved.\n\nAccess your collector dashboard here:\n${dashboardLink}`
      : `Hello ${applicantName},\n\nThank you for applying to collect data for "${studyTitle}". The researcher was unable to approve your application at this time.`,
    html,
  });
}
