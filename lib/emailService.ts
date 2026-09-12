import nodemailer from "nodemailer";

interface SendVerificationEmailParams {
  to: string;
  name: string;
  code: string;
  verificationLink: string;
}

export async function sendVerificationEmail({
  to,
  name,
  code,
  verificationLink,
}: SendVerificationEmailParams): Promise<{ success: boolean; simulated: boolean }> {
  const host = process.env.SMTP_HOST;
  const port = Number(process.env.SMTP_PORT) || 587;
  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_PASS;
  const from = process.env.SMTP_FROM || '"Tinat Research Platform" <no-reply@tinat.et>';

  // If SMTP is configured, send real email
  if (host && user && pass) {
    try {
      const transporter = nodemailer.createTransport({
        host,
        port,
        secure: port === 465,
        auth: { user, pass },
      });

      const html = `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 24px; border: 1px solid #e2e8f0; rounded: 8px;">
          <div style="text-align: center; margin-bottom: 24px;">
            <h1 style="color: #0f172a; margin: 0; font-size: 24px;">Welcome to Tinat, ${name}!</h1>
            <p style="color: #64748b; margin-top: 8px; font-size: 16px;">Please verify your email address to complete your registration.</p>
          </div>

          <div style="background-color: #f8fafc; border: 1px solid #cbd5e1; border-radius: 8px; padding: 24px; text-align: center; margin: 24px 0;">
            <p style="color: #475569; margin: 0 0 8px 0; font-size: 14px;">Your 6-digit verification code is:</p>
            <div style="font-size: 36px; font-weight: bold; letter-spacing: 8px; color: #16a34a; margin: 12px 0;">${code}</div>
            <p style="color: #94a3b8; font-size: 12px; margin: 0;">This code expires in 24 hours.</p>
          </div>

          <div style="text-align: center; margin: 32px 0;">
            <p style="color: #475569; font-size: 14px; margin-bottom: 16px;">Or simply click the button below to verify automatically:</p>
            <a href="${verificationLink}" style="display: inline-block; background-color: #16a34a; color: white; padding: 12px 32px; border-radius: 6px; text-decoration: none; font-weight: bold; font-size: 15px;">Verify My Email</a>
          </div>

          <hr style="border: none; border-top: 1px solid #e2e8f0; margin: 24px 0;" />
          <p style="color: #94a3b8; font-size: 12px; text-align: center; margin: 0;">
            If you did not create an account on Tinat, you can safely ignore this email.
          </p>
        </div>
      `;

      await transporter.sendMail({
        from,
        to,
        subject: `Verify your email for Tinat (${code})`,
        text: `Welcome to Tinat, ${name}! Your verification code is: ${code}. Or verify using this link: ${verificationLink}`,
        html,
      });

      console.log(`[Email Service] Real verification email sent to ${to}`);
      return { success: true, simulated: false };
    } catch (error) {
      console.error("[Email Service] Failed to send via SMTP, falling back to simulated output:", error);
    }
  }

  // Development / Simulation Fallback (prints clearly to console for instant testing)
  console.log("\n" + "=".repeat(70));
  console.log(" 📬 [TINAT EMAIL SIMULATION] VERIFICATION EMAIL DISPATCHED");
  console.log(` To: ${name} <${to}>`);
  console.log(` 🔑 6-Digit Code: ${code}`);
  console.log(` 🔗 Direct Link:  ${verificationLink}`);
  console.log("=".repeat(70) + "\n");

  return { success: true, simulated: true };
}
