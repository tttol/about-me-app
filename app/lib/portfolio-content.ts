export type SectionId =
  | "work-experience"
  | "speakings"
  | "articles"
  | "awards"
  | "certifications";

export type PortfolioSection = Readonly<{
  id: SectionId;
  label: string;
  kind: "section";
  eyebrow: string;
  title: string;
  description: string;
  items: readonly Readonly<{
    title: string;
    description: string;
    href?: string;
    linkLabel?: string;
  }>[];
}>;

type ExternalDestination = Readonly<{
  id: SectionId;
  label: string;
  kind: "external";
  href: string;
}>;

export const PORTFOLIO_SECTIONS: readonly (PortfolioSection | ExternalDestination)[] = [
  {
    id: "work-experience",
    label: "Work Experience",
    kind: "section",
    eyebrow: "Profile & practice",
    title: "Software Engineer",
    description:
      "Interested in Java, Next.js, and AWS Amplify. Connecting what I learn with what I build.",
    items: [
      {
        title: "AWS Community Builder",
        description: "Devtools category.",
        href: "https://builder.aws.com/community/@tol",
        linkLabel: "View community profile",
      },
      {
        title: "about-me-app",
        description:
          "My personal profile site, built with Next.js and React for static hosting on AWS.",
        href: "https://github.com/tttol/about-me-app",
        linkLabel: "View source",
      },
      {
        title: "LinkedIn",
        description: "My professional profile and a place to connect.",
        href: "https://www.linkedin.com/in/toru-takahashi-23b26729a/",
        linkLabel: "Connect on LinkedIn",
      },
    ],
  },
  {
    id: "speakings",
    label: "Speakings",
    kind: "section",
    eyebrow: "Ideas shared",
    title: "Sharing what I learn.",
    description: "Find my presentation materials on Speaker Deck.",
    items: [
      {
        title: "Speaker Deck",
        description: "Presentation slides, collected in one place.",
        href: "https://speakerdeck.com/tttol",
        linkLabel: "Browse presentations",
      },
    ],
  },
  {
    id: "articles",
    label: "Articles",
    kind: "external",
    href: "https://tttol.github.io/t-search/",
  },
  {
    id: "awards",
    label: "Awards",
    kind: "section",
    eyebrow: "Awards",
    title: "Recognition",
    description: "Details coming soon",
    items: [],
  },
  {
    id: "certifications",
    label: "Certifications",
    kind: "section",
    eyebrow: "Certifications",
    title: "Professional learning",
    description: "Details coming soon",
    items: [],
  },
];
