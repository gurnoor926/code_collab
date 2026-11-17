const axios = require("axios");

const sendResetPasswordEmail = async ({ to, resetUrl, name }) => {
  const apiKey =
    process.env.RESEND_API_KEY ||
    process.env.SMTP_PASSWORD ||
    process.env.SMTP_PASS;

  if (!apiKey) {
    throw new Error("Resend API key is not configured in environment variables.");
  }

  const from = process.env.SMTP_FROM || "CodeCollab <onboarding@resend.dev>";
  const displayName = name ? `Hi ${name},` : "Hello,";

  const html = `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Reset Your Password</title>
      </head>
      <body style="margin: 0; padding: 0; background-color: #0d0d14; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; color: #e4e4e7;">
        <table width="100%" cellpadding="0" cellspacing="0" style="padding: 40px 20px;">
          <tr>
            <td align="center">
              <table width="100%" cellpadding="0" cellspacing="0" style="max-width: 540px; background-color: #14141e; border: 1px solid #27273a; border-radius: 16px; overflow: hidden;">
                <!-- Header -->
                <tr>
                  <td style="padding: 32px 32px 24px 32px; border-bottom: 1px solid #27273a;">
                    <h1 style="margin: 0; font-size: 22px; font-weight: 700; color: #ffffff;">CodeCollab</h1>
                  </td>
                </tr>
                <!-- Body -->
                <tr>
                  <td style="padding: 32px;">
                    <h2 style="margin: 0 0 16px 0; font-size: 18px; font-weight: 600; color: #ffffff;">Password Reset Request</h2>
                    <p style="margin: 0 0 16px 0; font-size: 14px; line-height: 1.6; color: #a1a1aa;">
                      ${displayName}
                    </p>
                    <p style="margin: 0 0 24px 0; font-size: 14px; line-height: 1.6; color: #a1a1aa;">
                      We received a request to reset your password for your CodeCollab account. Click the button below to choose a new password. This link is valid for <strong>15 minutes</strong>.
                    </p>
                    <table cellpadding="0" cellspacing="0" style="margin: 0 0 24px 0;">
                      <tr>
                        <td align="center" style="border-radius: 12px; background-color: #6366f1;">
                          <a href="${resetUrl}" target="_blank" style="display: inline-block; padding: 14px 28px; font-size: 14px; font-weight: 600; color: #ffffff; text-decoration: none; border-radius: 12px;">
                            Reset Password
                          </a>
                        </td>
                      </tr>
                    </table>
                    <p style="margin: 0 0 16px 0; font-size: 13px; line-height: 1.6; color: #71717a;">
                      If the button doesn't work, copy and paste this link into your browser:
                    </p>
                    <p style="margin: 0 0 24px 0; font-size: 12px; line-height: 1.5; word-break: break-all; color: #818cf8;">
                      <a href="${resetUrl}" style="color: #818cf8; text-decoration: underline;">${resetUrl}</a>
                    </p>
                    <hr style="border: none; border-top: 1px solid #27273a; margin: 24px 0;" />
                    <p style="margin: 0; font-size: 12px; line-height: 1.5; color: #71717a;">
                      If you didn't request a password reset, you can safely ignore this email. Your password will remain unchanged.
                    </p>
                  </td>
                </tr>
                <!-- Footer -->
                <tr>
                  <td style="padding: 20px 32px; background-color: #101018; border-top: 1px solid #27273a; text-align: center;">
                    <p style="margin: 0; font-size: 12px; color: #52525b;">
                      &copy; ${new Date().getFullYear()} CodeCollab. All rights reserved.
                    </p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
        </table>
      </body>
    </html>
  `;

  const response = await axios.post(
    "https://api.resend.com/emails",
    {
      from,
      to: [to],
      subject: "Reset your CodeCollab password",
      html,
    },
    {
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
    }
  );

  return response.data;
};

module.exports = { sendResetPasswordEmail };
