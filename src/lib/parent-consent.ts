/** Media consent copy shown on /parentsconsent */
export const MEDIA_CONSENT_VERSION = "2026-media-v1";

export const MEDIA_CONSENT_INTRO = `Bits & Bots is a community robotics team in Collier County, Florida. We share team photos and videos on our website and social media (Facebook, Instagram, and similar) to celebrate the team, educate the community about STEM, and show our outreach and competition presence. We do not sell photos or use them for unrelated advertising.`;

export const MEDIA_CONSENT_TERMS = [
  "I am the parent or legal guardian of the child named below.",
  "I give permission for Bits & Bots to photograph and record video of my child during team activities, practices, competitions, and outreach events.",
  "I allow Bits & Bots to use those photos and videos on the team website (fllbots.com) and on team social media accounts for educational and team-promotion purposes only.",
  "My child's first name and team activities may appear with photos. We will not publish home addresses or personal contact details.",
  "I understand I may withdraw this consent at any time by emailing the coaches. Future posts will honor the withdrawal; removing content already shared on social media may take reasonable time.",
  "One parent or guardian signature is sufficient. We collect both parents' names and contact details when available for our records.",
];

export type ParentMediaConsentInput = {
  teamMemberId: string;
  motherName: string;
  motherEmail: string;
  motherPhone: string;
  fatherName: string;
  fatherEmail: string;
  fatherPhone: string;
  signedByName: string;
  signedByRelation: string;
  signatureDate: string;
  agreesWebsite: boolean;
  agreesSocialMedia: boolean;
};

export function parentConsentErrorMessage(error: unknown): string {
  if (error instanceof Error) return error.message;
  if (error && typeof error === "object" && "message" in error) {
    return String((error as { message: unknown }).message);
  }
  return String(error ?? "Request failed");
}

export function isParentConsentSetupMissing(error: unknown): boolean {
  const message = parentConsentErrorMessage(error).toLowerCase();
  return (
    message.includes("parent_media_consents") ||
    message.includes("schema cache") ||
    message.includes("could not find the table")
  );
}
