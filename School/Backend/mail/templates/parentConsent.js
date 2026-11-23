const escapeHtml = (value = "") =>
  String(value).replace(/[&<>"']/g, (ch) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[ch]));

export const parentConsentTemplate = ({ parentName, studentName, schoolClass, code }) => `
  <html>
    <body style="margin:0; padding:24px; background-color:#f3f4f6; font-family:Arial, sans-serif; color:#111827;">
      <table width="100%" cellpadding="0" cellspacing="0" style="max-width:620px; margin:0 auto; background:#ffffff; border:1px solid #e5e7eb; border-radius:12px; overflow:hidden;">
        <tr>
          <td style="padding:18px 24px; background:#111827; color:#ffffff; text-align:center;">
            <h2 style="margin:0; font-size:20px; letter-spacing:0.5px;">Kanthast School</h2>
          </td>
        </tr>
        <tr>
          <td style="padding:28px 24px; font-size:15px; line-height:1.6;">
            <p style="margin:0 0 12px 0;">Hello <strong>${escapeHtml(parentName)}</strong>,</p>
            <p style="margin:0 0 12px 0;">
              ${escapeHtml(studentName)} (Class ${escapeHtml(schoolClass)}) has asked to use <strong>Doubts</strong> on Kanthast School and named you as their parent or guardian.
            </p>
            <p style="margin:0 0 8px 0;"><strong>What you are approving</strong></p>
            <ul style="margin:0 0 16px 18px; padding:0;">
              <li>Your child can post study questions and answers that classmates in the same class can read.</li>
              <li>They appear as first name and class only. There are no private messages.</li>
              <li>Every post is checked before it is shown. Phone numbers, links and social media IDs are blocked.</li>
              <li>You can withdraw this approval at any time from Settings in your child's account.</li>
            </ul>
            <p style="margin:0 0 12px 0;">If you approve, give this code to your child to enter:</p>
            <div style="text-align:center; margin:0 0 18px 0;">
              <span style="display:inline-block; padding:14px 30px; border:1px solid #d1d5db; border-radius:10px; background:#f9fafb; font-size:30px; font-weight:700; letter-spacing:6px;">
                ${escapeHtml(code)}
              </span>
            </div>
            <p style="margin:0; font-size:12px; color:#6b7280; text-align:center;">
              The code expires in 15 minutes. If you did not expect this email, ignore it and nothing will be approved.
            </p>
          </td>
        </tr>
        <tr>
          <td style="padding:16px 24px; border-top:1px solid #e5e7eb; text-align:center; font-size:12px; color:#6b7280;">
            This is an automated email from Kanthast School.
          </td>
        </tr>
      </table>
    </body>
  </html>
`;
