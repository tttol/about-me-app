export type SectionId =
  | "work-experience"
  | "speakings"
  | "articles"
  | "awards"
  | "certifications";

type NavigationEntry = Readonly<{
  id: SectionId;
  label: string;
}> & (
  | Readonly<{ kind: "section" }>
  | Readonly<{ kind: "external"; href: string }>
);

export const PORTFOLIO_NAVIGATION: readonly NavigationEntry[] = [
  { id: "work-experience", label: "Work Experience", kind: "section" },
  { id: "speakings", label: "Speakings", kind: "section" },
  { id: "articles", label: "Articles", kind: "external", href: "https://tttol.github.io/t-search/" },
  { id: "awards", label: "Awards", kind: "section" },
  { id: "certifications", label: "Certifications", kind: "section" },
];
