/**
 * Waitlist Email Templates
 *
 * Templates for notifying users when their school launches on HIVE.
 */

export interface SchoolLaunchEmailParams {
  schoolName: string;
  schoolId: string;
  recipientEmail: string;
}

/**
 * Generate the HTML email for school launch notification
 */
export function generateSchoolLaunchEmail(params: SchoolLaunchEmailParams): {
  subject: string;
  html: string;
} {
  const { schoolName, schoolId } = params;

  const enterUrl = `https://hive.college/enter?schoolId=${encodeURIComponent(schoolId)}`;

  const subject = `${schoolName} is now on HIVE`;

  const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${schoolName} is on HIVE</title>
</head>
<body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'SF Pro Text', 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background-color: #000000; color: #ffffff;">
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="background-color: #000000;">
    <tr>
      <td align="center" style="padding: 60px 20px;">
        <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="max-width: 480px;">

          <!-- Logo -->
          <tr>
            <td align="center" style="padding-bottom: 40px;">
              <span style="font-size: 15px; font-weight: 600; letter-spacing: 0.1em; color: rgba(255, 255, 255, 0.9);">HIVE</span>
            </td>
          </tr>

          <!-- Main Headline -->
          <tr>
            <td align="center" style="padding-bottom: 16px;">
              <span style="font-size: 32px; font-weight: 600; color: #ffffff; font-family: -apple-system, BlinkMacSystemFont, 'SF Pro Display', sans-serif;">${schoolName} is on HIVE</span>
            </td>
          </tr>

          <!-- Subheadline -->
          <tr>
            <td align="center" style="padding-bottom: 40px;">
              <span style="font-size: 16px; color: rgba(255, 255, 255, 0.5); line-height: 1.6;">
                You asked to be notified. We're now live at your school.
              </span>
            </td>
          </tr>

          <!-- CTA Button -->
          <tr>
            <td align="center" style="padding-bottom: 48px;">
              <a href="${enterUrl}" style="display: inline-block; background: linear-gradient(135deg, #FFD700 0%, #FFC000 100%); color: #000000; font-size: 16px; font-weight: 600; text-decoration: none; padding: 16px 32px; border-radius: 12px;">
                Join HIVE
              </a>
            </td>
          </tr>

          <!-- Divider -->
          <tr>
            <td align="center" style="padding-bottom: 24px;">
              <div style="width: 40px; height: 1px; background-color: rgba(255, 255, 255, 0.1);"></div>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td align="center">
              <span style="font-size: 13px; color: rgba(255, 255, 255, 0.3); line-height: 1.6;">
                You're receiving this because you joined our waitlist.<br>
                <a href="https://hive.college" style="color: rgba(255, 255, 255, 0.4);">hive.college</a>
              </span>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>
  `;

  return { subject, html };
}
