import Image from "next/image";
import { GitHub, LinkedIn, X } from "../icons";

const SOCIAL_LINKS = [
  { label: "X (Twitter)", href: "https://x.com/tttol777", Icon: X },
  { label: "GitHub", href: "https://github.com/tttol", Icon: GitHub },
  {
    label: "LinkedIn",
    href: "https://www.linkedin.com/in/toru-takahashi-23b26729a/",
    Icon: LinkedIn,
  },
];

export default function AboutMe(): React.JSX.Element {
  return (
    <header className="profile">
      <h1>About Me</h1>
      <Image
        className="profile__portrait"
        src="/me-square.png"
        alt="Toru Takahashi"
        loading="eager"
        width={200}
        height={200}
      />
      <p className="profile__name">Toru Takahashi</p>
      <p>Connecting the dots</p>
      <nav className="profile__socials" aria-label="Social media">
        {SOCIAL_LINKS.map(({ label, href, Icon }) => (
          <a
            key={label}
            href={href}
            aria-label={label}
            title={label}
            target="_blank"
            rel="noopener noreferrer"
          >
            <span aria-hidden="true"><Icon /></span>
          </a>
        ))}
      </nav>
    </header>
  );
}
