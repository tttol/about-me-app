export type WorkChapter = Readonly<{
  id: string;
  company: string;
  initial: string;
  chapter: string;
  responsibilities: string;
  project: Readonly<{ title: string; description: string }>;
  takeaway: string;
}>;

// Company names and chapter details remain placeholders until supplied.
export const WORK_CHAPTERS: readonly WorkChapter[] = [
  {
    id: "company-c",
    company: "Company C",
    initial: "C",
    chapter: "Third chapter",
    responsibilities: "Role, team, and scope of responsibility.",
    project: {
      title: "Project / initiative",
      description: "The problem, your contribution, and the outcome.",
    },
    takeaway: "Skills and ideas that shaped the next chapter.",
  },
  {
    id: "company-b",
    company: "Company B",
    initial: "B",
    chapter: "Second chapter",
    responsibilities: "Role, team, and scope of responsibility.",
    project: {
      title: "Project / initiative",
      description: "The problem, your contribution, and the outcome.",
    },
    takeaway: "Skills and ideas that shaped the next chapter.",
  },
  {
    id: "company-a",
    company: "Company A",
    initial: "A",
    chapter: "First chapter",
    responsibilities: "Role, team, and scope of responsibility.",
    project: {
      title: "Project / initiative",
      description: "The problem, your contribution, and the outcome.",
    },
    takeaway: "Skills and ideas that shaped the next chapter.",
  },
];
