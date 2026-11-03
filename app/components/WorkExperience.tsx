"use client";

import { useId, useState } from "react";
import { WORK_CHAPTERS } from "../lib/work-experience";
import "./work-experience.css";

type WorkExperienceProps = Readonly<{
  onBack: () => void;
  links: readonly Readonly<{ title: string; href?: string }>[];
}>;

export default function WorkExperience({ onBack, links }: WorkExperienceProps): React.JSX.Element {
  const [expandedChapter, setExpandedChapter] = useState<string | null>(null);
  const chapterPrefix = useId();

  const toggleChapter = (id: string): void => {
    setExpandedChapter((current) => current === id ? null : id);
  };

  return (
    <>
      <div className="work-experience__navigation">
        <span>Toru Takahashi</span>
        <button type="button" className="work-experience__back" onClick={onBack}>← Back to connections</button>
      </div>
      <div className="work-experience__heading">
        <h1 id="connection-heading">Work Experience</h1>
        <p>Three chapters. One connected journey.</p>
      </div>
      <ol className="career-timeline" aria-label="Company chapters">
        {WORK_CHAPTERS.map((chapter) => {
          const expanded = expandedChapter === chapter.id;
          const headingId = `${chapterPrefix}-${chapter.id}-heading`;
          const panelId = `${chapterPrefix}-${chapter.id}-details`;

          return (
            <li key={chapter.id} className={`career-chapter${expanded ? " career-chapter--expanded" : ""}`}>
              <article className="career-chapter__layout" aria-labelledby={headingId}>
                <button
                  type="button"
                  className="career-chapter__dot"
                  aria-label={`${expanded ? "Collapse" : "Explore"} ${chapter.company} chapter`}
                  aria-expanded={expanded}
                  aria-controls={panelId}
                  onClick={() => toggleChapter(chapter.id)}
                >
                  <span aria-hidden="true">{chapter.initial}</span>
                </button>
                <div className="career-chapter__copy">
                  <p className="career-chapter__eyebrow">{chapter.chapter}</p>
                  <h2 id={headingId}>{chapter.company}</h2>
                  <div className="career-chapter__summary" hidden={expanded}>
                    <p>Role &amp; responsibilities</p>
                    <p>Projects, contributions, and lessons learned.</p>
                  </div>
                  <button
                    type="button"
                    className="career-chapter__toggle"
                    aria-expanded={expanded}
                    aria-controls={panelId}
                    onClick={() => toggleChapter(chapter.id)}
                  >
                    {expanded ? "Collapse chapter −" : "Explore chapter"}
                  </button>
                  <div className="career-chapter__expansion" data-open={expanded} aria-hidden={!expanded} inert={!expanded}>
                    <div className="career-chapter__clip">
                      <div id={panelId} className="career-chapter__details" role="region" aria-label={`${chapter.company} details`}>
                        <div>
                          <h3>Role &amp; responsibilities</h3>
                          <p>{chapter.responsibilities}</p>
                        </div>
                        <div>
                          <h3>Selected work</h3>
                          <h4>{chapter.project.title}</h4>
                          <p>{chapter.project.description}</p>
                        </div>
                        <div>
                          <h3>What I carried forward</h3>
                          <p>{chapter.takeaway}</p>
                        </div>
                        <p className="career-chapter__connection">Connecting this chapter to what came next.</p>
                      </div>
                    </div>
                  </div>
                </div>
              </article>
            </li>
          );
        })}
      </ol>
      <footer className="work-experience__footer">
        <p>Company names and chapter details are placeholders.</p>
        <nav aria-label="Professional profiles">
          {links.map((item) => item.href && (
            <a key={item.title} href={item.href} target="_blank" rel="noopener noreferrer">{item.title} ↗</a>
          ))}
        </nav>
      </footer>
    </>
  );
}
