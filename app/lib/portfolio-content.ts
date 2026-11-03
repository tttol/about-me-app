export type SectionId =
  | "work-experience"
  | "speakings"
  | "articles"
  | "awards"
  | "certifications";

export type PortfolioSection = Readonly<{
  id: SectionId;
  label: string;
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

export const PORTFOLIO_SECTIONS: readonly PortfolioSection[] = [
  {
    id: "work-experience",
    label: "Work Experience",
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
    eyebrow: "Learning, written down",
    title: "Notes along the way.",
    description: "Read my writing on my blog and Qiita.",
    items: [
      {
        title: "Blog",
        description: "My personal blog.",
        href: "https://blog.about-tttol.link/",
        linkLabel: "Visit the blog",
      },
      {
        title: "Qiita",
        description: "My technical writing on Qiita.",
        href: "https://qiita.com/tttol777",
        linkLabel: "Read on Qiita",
      },
    ],
  },
  {
    id: "awards",
    label: "Awards",
    eyebrow: "Awards",
    title: "Recognition",
    description: "Details coming soon",
    items: [],
  },
  {
    id: "certifications",
    label: "Certifications",
    eyebrow: "Certifications",
    title: "Professional learning",
    description: "Details coming soon",
    items: [],
  },
];
