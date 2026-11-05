import { BackLink } from "../components/Connections";

export default function AwardsPage(): React.JSX.Element {
  return (
    <section className="connection-content" aria-labelledby="connection-heading" tabIndex={-1}>
      <BackLink />
      <p className="connection-content__eyebrow">Awards</p>
      <h2 id="connection-heading">Awards</h2>
      <p className="connection-content__title">Recognition</p>
      <p className="connection-content__description">Details coming soon</p>
    </section>
  );
}
