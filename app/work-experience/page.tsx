"use client";

import { useId, useState } from "react";
import { BackLink } from "../components/Connections";
import "./work-experience.css";

type WorkChapter = Readonly<{
  company: string;
  description: string;
}>;

const WORK_CHAPTERS: readonly WorkChapter[] = [
  {
    company: "PayPay Card Corporation",
    description: "2025 - now\n\nJava, AWS",
  },
  {
    company: "NRI Netcom, Ltd.",
    description: "2021 - 2025\n\n- Implemented Amazon Athena adoption to enable SQL queries on S3 log files, reducing analysis time from a full day to under an hour and boosting operational efficiency.\n\n - Implemented SES Virtual Deliverability Manager (VDM), reducing email delivery investigation time from over a day to a few hours and accelerating customer response.\n\n - Developing Java applications using Spring Boot. On average, I create 5 pull requests and review 10 pull requests per month.",
  },
  {
    company: "CSE Co.,Ltd.",
    description: "2018 - 2020\n\nDeveloping Java applications using Struts, Spring Boot.",
  },
];

export default function WorkExperiencePage(): React.JSX.Element {
  const [expandedChapter, setExpandedChapter] = useState<string | null>(null);
  const chapterPrefix = useId();

  const toggleChapter = (id: string): void => {
    setExpandedChapter((current) => current === id ? null : id);
  };

  return (
    <section className="connection-content work-experience" aria-labelledby="connection-heading" tabIndex={-1}>
      <div className="work-experience__navigation">
        <BackLink className="work-experience__back" />
      </div>
      <div className="work-experience__heading">
        <h2 id="connection-heading">Work Experience</h2>
      </div>
      <ol className="career-timeline" aria-label="Company chapters">
        {WORK_CHAPTERS.map((chapter, index) => {
          const expanded = expandedChapter === chapter.company;
          const headingId = `${chapterPrefix}-${index}-heading`;
          const panelId = `${chapterPrefix}-${index}-details`;

          return (
            <li key={chapter.company} className={`career-chapter${expanded ? " career-chapter--expanded" : ""}`}>
              <article className="career-chapter__layout" aria-labelledby={headingId}>
                <button
                  type="button"
                  className="career-chapter__dot"
                  aria-label={`${expanded ? "Collapse" : "Explore"} ${chapter.company} chapter`}
                  aria-expanded={expanded}
                  aria-controls={panelId}
                  onClick={() => toggleChapter(chapter.company)}
                />
                <div className="career-chapter__copy">
                  <h4 id={headingId}>{chapter.company}</h4>
                  <button
                    type="button"
                    className="career-chapter__toggle"
                    aria-expanded={expanded}
                    aria-controls={panelId}
                    onClick={() => toggleChapter(chapter.company)}
                  >
                    {expanded ? "Collapse chapter −" : "Explore chapter"}
                  </button>
                  <div className="career-chapter__expansion" data-open={expanded} aria-hidden={!expanded} inert={!expanded}>
                    <div className="career-chapter__clip">
                      <div id={panelId} className="career-chapter__details" role="region" aria-label={`${chapter.company} details`}>
                        <p>{chapter.description}</p>
                      </div>
                    </div>
                  </div>
                </div>
              </article>
            </li>
          );
        })}
      </ol>
      <p className="work-experience__more-info">
        More info: <a href="https://www.linkedin.com/in/toru-takahashi-23b26729a/" target="_blank" rel="noopener noreferrer">LinkedIn ↗</a>
      </p>
    </section>
  );
}
