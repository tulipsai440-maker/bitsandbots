import type { TeamBranding } from "@/lib/team-branding";
import { consentFormUrl, emailSignoff } from "@/lib/team-branding";

export type BroadcastTemplate = {
  id: string;
  label: string;
  subject: string;
  body: string;
};

export function getBroadcastTemplates(branding: TeamBranding): BroadcastTemplate[] {
  const { siteName } = branding;
  const signoff = emailSignoff(branding);
  const consentUrl = consentFormUrl(branding);

  return [
    {
      id: "general-update",
      label: "General update",
      subject: `${siteName} team update`,
      body: `Hi families,

A quick update from the ${signoff}:

[Your message here]

Thank you,
${signoff}`,
    },
    {
      id: "practice-reminder",
      label: "Practice tomorrow",
      subject: `Reminder: ${siteName} practice tomorrow`,
      body: `Hi families,

Quick reminder — ${siteName} practice is tomorrow. Please arrive a few minutes early.

See you there,
${signoff}`,
    },
    {
      id: "assignment-reminder",
      label: "Assignment reminder",
      subject: `${siteName} — assignment due soon`,
      body: `Hi families,

A team assignment is due soon. Please have your student check the Assignments page and add a short note when they update their task.

Thank you,
${signoff}`,
    },
    {
      id: "consent-needed",
      label: "Consent form needed",
      subject: `${siteName} — media consent form`,
      body: `Hi families,

We still need your media consent form for photo and video use. One parent signature is enough.

Please complete it here: ${consentUrl}

Thank you,
${signoff}`,
    },
    {
      id: "bring-laptop",
      label: "Bring laptop",
      subject: `${siteName} — bring a laptop`,
      body: `Hi families,

For our next session, please have your student bring a charged laptop if they have one.

Thanks,
${signoff}`,
    },
    {
      id: "practice-cancelled",
      label: "Practice cancelled",
      subject: `${siteName} — practice cancelled`,
      body: `Hi families,

Today's ${siteName} practice is cancelled. We'll share the next meeting time on the calendar.

Thanks,
${signoff}`,
    },
  ];
}
