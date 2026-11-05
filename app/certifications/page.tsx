import { BackLink } from "../components/Connections";

export default function CertificationsPage(): React.JSX.Element {
  return (
    <section className="connection-content" aria-labelledby="connection-heading" tabIndex={-1}>
      <BackLink />
      <p className="connection-content__eyebrow">Certifications</p>
      <h2 id="connection-heading">Certifications</h2>
      <p className="connection-content__title">Professional learning</p>
      <p className="connection-content__description">Details coming soon</p>
    </section>
  );
}
