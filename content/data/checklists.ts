// Checklist items, moved verbatim from the page HTML. `id` is the legacy data-checklist value: persisted check keys are `${id}:${index}`,
// so do not rename ids or reorder items without a state migration.
export type ChecklistGroup = { id: string; title: string; items: string[] };

export const CHECKLISTS: Record<string, { header: boolean; titleTag: 'h3' | 'h4'; groups: ChecklistGroup[] }> = {
  "ch12": {
    header: false,
    titleTag: 'h4',
    groups: [
      {
        id: "ch12-d1",
        title: "Days 1 to 30 (Install System)",
        items: [
          "CRM setup",
          "Contacts tagged",
          "Follow-up plans live",
          "50 sphere conversations",
          "1 open house",
          "Speed-to-lead tested",
        ],
      },
      {
        id: "ch12-d2",
        title: "Days 31 to 60 (Build Rhythm)",
        items: [
          "Morning blocks held 4 of 5 days",
          "15 to 25 conversations per week",
          "First consultations held",
          "Buyer agreement signed",
        ],
      },
      {
        id: "ch12-d3",
        title: "Days 61 to 90 (Grow Pipeline)",
        items: [
          "5+ active opportunities",
          "1st contract written",
          "Post-close plan built",
          "Lead sources evaluated",
        ],
      },
    ],
  },
  "app-c": {
    header: true,
    titleTag: 'h3',
    groups: [
      {
        id: "app-c-profile",
        title: "Profile",
        items: [
          "Professional headshot uploaded.",
          "Bio written in plain language (three short paragraphs).",
          "Phone, email, license number and social links current.",
          "Marketing Profile complete: colors, logo, tagline.",
          "Agent Site reviewed on phone and desktop.",
        ],
      },
      {
        id: "app-c-contacts",
        title: "Contacts",
        items: [
          "Phone contacts exported and imported.",
          "Email contacts imported.",
          "Social connections added.",
          "Duplicates merged.",
          "Every contact tagged by relationship (sphere, past client, lead, vendor).",
          "Every contact tagged by lead source.",
        ],
      },
      {
        id: "app-c-smartplans",
        title: "Follow-up plans",
        items: [
          "New online lead plan built (Appendix B.1), with day-0 automated text and email only after the lead has agreed to texts.",
          "8x8 sphere plan built (B.2).",
          "Quarterly database plan built (B.3) and applied to the whole database.",
          "Post-close plan built (B.4).",
          "Every message rewritten in your own voice.",
        ],
      },
      {
        id: "app-c-pipeline-and-routing",
        title: "Pipeline and routing",
        items: [
          "Opportunities stages renamed to match how you work.",
          "Existing leads placed in the correct stage.",
          "Lead routing rules set (teams only).",
        ],
      },
      {
        id: "app-c-mobile-and-testing",
        title: "Mobile and testing",
        items: [
          "CRM mobile app installed.",
          "Notifications on for new leads and due tasks.",
          "Speed-to-lead test completed (friend submits inquiry at 8 p.m.; times recorded).",
          "Friday review block and monthly review on the calendar.",
        ],
      },
    ],
  },
};
