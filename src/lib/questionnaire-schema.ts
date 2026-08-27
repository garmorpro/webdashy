/**
 * Field-by-field schema for the Design Questionnaire — mirrors the PDF
 * ("Website Project Questionnaire") this feature was built from, section
 * for section, question for question. This is the single source of truth
 * for both the public wizard (renders itself from this) and validation
 * (which fields are required before a submit is accepted).
 *
 * Answers are stored as a flat Record<fieldKey, string> — see
 * DesignQuestionnaire.answers in schema.prisma for why that's a JSON blob
 * rather than one column per question.
 */

export type QuestionnaireFieldType = "text" | "textarea" | "yesno";

export interface QuestionnaireField {
  key: string;
  label: string;
  helper?: string;
  placeholder?: string;
  required: boolean;
  type: QuestionnaireFieldType;
}

export interface QuestionnaireSection {
  id: string;
  title: string;
  description?: string;
  fields: QuestionnaireField[];
}

/**
 * Display formatting for a raw stored answer — currently only matters for
 * "yesno" fields, whose raw value is the lowercase "yes"/"no" the wizard's
 * toggle buttons write (see questionnaire-wizard.tsx). Used by both the
 * admin responses dialog and the PDF export so they never drift — e.g. a
 * capitalization fix here doesn't need to be made twice.
 */
export function formatFieldValue(field: QuestionnaireField, value: string): string {
  if (field.type === "yesno") {
    if (value === "yes") return "Yes";
    if (value === "no") return "No";
  }
  return value;
}

export type QuestionnaireAnswers = Record<string, string>;

export const QUESTIONNAIRE_INTRO =
  "Please complete all sections marked with * before our first meeting.";

export const QUESTIONNAIRE_SECTIONS: QuestionnaireSection[] = [
  {
    id: "contact",
    title: "Contact Information",
    fields: [
      { key: "firstName", label: "First Name", required: false, type: "text" },
      { key: "lastName", label: "Last Name", required: false, type: "text" },
      { key: "phone", label: "Phone Number", required: false, type: "text" },
      { key: "email", label: "Email Address", required: false, type: "text" },
      { key: "companyName", label: "Company Name", required: false, type: "text" },
      {
        key: "registeredAddress",
        label: "Registered Business Address",
        required: false,
        type: "text",
      },
    ],
  },
  {
    id: "business",
    title: "Business Details",
    description: "These details will appear publicly on your website.",
    fields: [
      { key: "displayedBusinessName", label: "Displayed Business Name", required: true, type: "text" },
      {
        key: "displayedBusinessAddress",
        label: "Displayed Business Address",
        helper: "Can be the same as your registered address.",
        required: true,
        type: "text",
      },
      { key: "displayedPhone", label: "Displayed Phone Number", required: true, type: "text" },
      { key: "displayedEmail", label: "Displayed Email Address", required: true, type: "text" },
      {
        key: "socialMedia",
        label: "Social Media Accounts",
        helper:
          "List all that apply and include full links — Facebook, X, Instagram, LinkedIn, YouTube, TikTok, etc.",
        required: true,
        type: "textarea",
      },
      { key: "businessHours", label: "Business Hours", required: true, type: "text" },
      {
        key: "domain",
        label: "Do you already have a website domain?",
        helper:
          "What is your domain, or what would you like it to be? If you already have one, provide the URL. If not, suggest a preferred name (subject to availability).",
        required: true,
        type: "textarea",
      },
      {
        key: "googleBusinessProfile",
        label: "Do you have a Google Business Profile already set up?",
        required: false,
        type: "text",
      },
    ],
  },
  {
    id: "about",
    title: "About Your Business",
    fields: [
      {
        key: "story",
        label: "Tell me your story.",
        helper:
          "Why did you get into business? What are you passionate about? How did you get started? How much experience do you have?",
        required: true,
        type: "textarea",
      },
      {
        key: "businessEmails",
        label: "Business Email Addresses",
        helper:
          "If you have a domain, do you have business emails attached? (e.g. hello@yourdomain.com). List them all below. If none, write N/A.",
        required: true,
        type: "textarea",
      },
      {
        key: "areasServed",
        label: "What areas do you serve?",
        helper: "Do you offer your services/products locally, regionally, or globally?",
        required: true,
        type: "textarea",
      },
      {
        key: "idealCustomer",
        label: "Who is your ideal customer?",
        helper: "Who do you target? What does your ideal customer look like?",
        required: true,
        type: "textarea",
      },
      {
        key: "topServices",
        label: "Top 3–4 Services to Advertise",
        helper: "What are the main services/products you'd like to emphasise on your website?",
        required: true,
        type: "textarea",
      },
      {
        key: "otherServices",
        label: "Other / Supporting Services",
        helper: "Any smaller services you'd like to include but not put as much emphasis on?",
        required: true,
        type: "textarea",
      },
      {
        key: "differentiators",
        label: "What makes you different from competitors?",
        helper: "It can be as simple as being local to the area, or a particularly unique selling point.",
        required: true,
        type: "textarea",
      },
      {
        key: "stats",
        label: "Do you have any impressive statistics?",
        helper: "e.g. XX years of experience, YYY projects completed, won Z award, etc.",
        required: true,
        type: "textarea",
      },
      {
        key: "otherBusinessDetails",
        label: "Anything else about you or your business?",
        helper: "Any other details not yet covered that you'd like us to know.",
        required: false,
        type: "textarea",
      },
    ],
  },
  {
    id: "content",
    title: "Website Content",
    fields: [
      {
        key: "desiredPages",
        label: "What pages do you want on your website?",
        helper:
          "A typical 5-page website includes: Home, About, Services, Gallery/Testimonials, and Contact. We recommend one page per service for SEO. Pages beyond five are billed at a one-time fee of $100/page.",
        placeholder: "e.g. Home, About, Hardwood Flooring, Stair Refinishing, Contact",
        required: true,
        type: "textarea",
      },
      {
        key: "customerActions",
        label: "What can customers do on your website?",
        helper: "e.g. contact you, read your blog, book appointments, request a quote, etc.",
        required: true,
        type: "textarea",
      },
      {
        key: "keyInfo",
        label: "What key information should be displayed?",
        helper: "Think: opening times, work showcases, menus, service area maps, testimonials, etc.",
        required: true,
        type: "textarea",
      },
      {
        key: "callsToAction",
        label: "What are your primary calls to action?",
        helper:
          'What actions should visitors take that would count as a "success"? These will form your sales funnel. (e.g. booking a consultation, requesting a quote, calling you)',
        required: true,
        type: "textarea",
      },
      {
        key: "pagesNeedingUpdates",
        label: "Will any pages need regular updates or your input?",
        helper: "e.g. blogs, menus, vacancy listings, adoption pages, project galleries, etc.",
        required: true,
        type: "textarea",
      },
      {
        key: "otherContentDetails",
        label: "Any other content-related details?",
        required: false,
        type: "textarea",
      },
    ],
  },
  {
    id: "design",
    title: "Design & Inspiration",
    fields: [
      {
        key: "competitorLinks",
        label: "Links to direct competitors' websites",
        helper: "What do you like or dislike about their websites?",
        placeholder: "https://competitor1.com — I like... I dislike...",
        required: true,
        type: "textarea",
      },
      {
        key: "referenceWebsites",
        label: "2–3 reference websites you love",
        helper:
          "What do you like (or dislike) about them? You can use themeforest.net, pinterest.com, or dribbble.com for inspiration.",
        placeholder: "https://example.com — I like the layout because...",
        required: true,
        type: "textarea",
      },
      {
        key: "aesthetic",
        label: "How would you describe your ideal website aesthetic?",
        helper: "e.g. modern & minimal, bold & colourful, professional & corporate, warm & friendly, etc.",
        required: true,
        type: "textarea",
      },
      {
        key: "existingBranding",
        label: "Do you have existing branding?",
        helper: "Do you have logos, fonts, colours, or other branding guidelines we should follow?",
        required: true,
        type: "textarea",
      },
      {
        key: "otherDesignDetails",
        label: "Any other design-related details?",
        required: false,
        type: "textarea",
      },
    ],
  },
  {
    id: "project",
    title: "Project Details",
    fields: [
      {
        key: "launchTimeline",
        label: "Target launch date / timeline",
        placeholder: "e.g. as soon as possible / by March 2025",
        required: true,
        type: "text",
      },
      {
        key: "googleAnalytics",
        label: "Would you like Google Analytics on your website?",
        helper:
          "Only select Yes if you are familiar with Google Analytics. This adds a tracking script to your website and is not included in our monthly packages.",
        required: false,
        type: "yesno",
      },
      {
        key: "howFoundUs",
        label: "How did you find us?",
        placeholder: "e.g. Google search, Instagram, referral from a friend, etc.",
        required: true,
        type: "text",
      },
    ],
  },
];

export const TOTAL_QUESTIONNAIRE_FIELDS = QUESTIONNAIRE_SECTIONS.reduce(
  (sum, s) => sum + s.fields.length,
  0
);
export const REQUIRED_QUESTIONNAIRE_FIELDS = QUESTIONNAIRE_SECTIONS.flatMap((s) =>
  s.fields.filter((f) => f.required)
).length;

/** Field keys with no answer, across every section — used to block submit. */
export function getMissingRequiredFields(answers: QuestionnaireAnswers): string[] {
  const missing: string[] = [];
  for (const section of QUESTIONNAIRE_SECTIONS) {
    for (const field of section.fields) {
      if (field.required && !answers[field.key]?.trim()) {
        missing.push(field.key);
      }
    }
  }
  return missing;
}

/** Which section (by index) a given field key lives in — used to jump the wizard to the first incomplete section on a failed submit. */
export function sectionIndexForField(fieldKey: string): number {
  return QUESTIONNAIRE_SECTIONS.findIndex((s) => s.fields.some((f) => f.key === fieldKey));
}

/** How many of a section's fields have a non-empty answer — for the section-nav "done" checkmark. */
export function isSectionComplete(section: QuestionnaireSection, answers: QuestionnaireAnswers): boolean {
  return section.fields
    .filter((f) => f.required)
    .every((f) => Boolean(answers[f.key]?.trim()));
}

/** Total answered fields (any field, not just required) — used for the admin summary ("28 of 35 questions answered"). */
export function countAnsweredFields(answers: QuestionnaireAnswers): number {
  return QUESTIONNAIRE_SECTIONS.flatMap((s) => s.fields).filter((f) =>
    Boolean(answers[f.key]?.trim())
  ).length;
}
