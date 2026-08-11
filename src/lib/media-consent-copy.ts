import type { TeamBranding } from "@/lib/team-branding";
import { consentFormUrl, emailSignoff } from "@/lib/team-branding";

export function buildMediaConsentIntro({ siteName }: TeamBranding): string {
  return `${siteName} may share team photos and videos on our website and on team social media (for example Facebook or Instagram) to celebrate the team and share our activities. We do not sell photos or use them for unrelated advertising.`;
}

export function buildMediaConsentTerms(branding: TeamBranding): string[] {
  const { siteName, siteUrl } = branding;
  const websiteHost = siteUrl.replace(/^https?:\/\//, "").replace(/\/$/, "");

  return [
    "I am the parent or legal guardian of the child named below.",
    `I give permission for ${siteName} to photograph and record video of my child during team activities, practices, competitions, and outreach events.`,
    `I allow ${siteName} to use those photos and videos on the team website (${websiteHost}) and on team social media accounts for team-promotion purposes only.`,
    "My child's first name and team activities may appear with photos. We will not publish home addresses or personal contact details.",
    "I understand I may withdraw this consent at any time by emailing the coaches. Future posts will honor the withdrawal; removing content already shared on social media may take reasonable time.",
    "One parent or guardian signature is sufficient. We collect both parents' names and contact details when available for our records.",
  ];
}

export function buildMediaConsentBothParentsNote(): string {
  return "No. One parent or legal guardian signature is enough. Please fill in both parents' names and contact details when you have them — that helps coaches reach your family.";
}

export type ConsentReminderRecipient = {
  email: string;
  parentName: string;
  kidNames: string[];
};

function escapeHtml(s: string) {
  return s.replace(/[&<>"']/g, (c) =>
    ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c] as string,
  );
}

export function buildConsentReminderEmail(
  branding: TeamBranding,
  recipient: ConsentReminderRecipient,
  formUrl: string,
): { subject: string; text: string; html: string } {
  const { siteName } = branding;
  const signoff = emailSignoff(branding);
  const kids =
    recipient.kidNames.length === 1
      ? recipient.kidNames[0]
      : recipient.kidNames.slice(0, -1).join(", ") +
        " and " +
        recipient.kidNames[recipient.kidNames.length - 1];

  const subject = `${siteName} — media consent form`;
  const text = `Hi ${recipient.parentName},

We still need the ${siteName} media consent form for ${kids}.

One parent signature is enough. Please complete it here:
${formUrl}

Thank you,
${signoff}`;

  const html = `
    <div style="font-family:Inter,Arial,sans-serif;max-width:560px;line-height:1.5;color:#1a1a1a">
      <p>Hi ${escapeHtml(recipient.parentName)},</p>
      <p>We still need the ${escapeHtml(siteName)} media consent form for <strong>${escapeHtml(kids)}</strong>.</p>
      <p>One parent signature is enough.</p>
      <p style="margin:24px 0">
        <a href="${escapeHtml(formUrl)}" style="display:inline-block;background:#1f3d1f;color:#fff;padding:12px 20px;border-radius:8px;text-decoration:none;font-weight:600">
          Complete consent form
        </a>
      </p>
      <p style="font-size:13px;color:#666">Or copy this link: ${escapeHtml(formUrl)}</p>
      <p style="color:#666;font-size:13px;margin-top:24px">— ${escapeHtml(signoff)}</p>
    </div>`;

  return { subject, text, html };
}

export function buildConsentFormUrl(branding: TeamBranding, origin?: string): string {
  return consentFormUrl(branding, origin);
}
