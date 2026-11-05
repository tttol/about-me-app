import { BackLink } from "../components/Connections";

export default function AwardsPage(): React.JSX.Element {
  return (
    <section className="connection-content" aria-labelledby="connection-heading" tabIndex={-1}>
      <BackLink />
      <p className="connection-content__eyebrow">Awards</p>
      <h2 id="connection-heading">Awards</h2>
      <ul className="connection-list">
        <li>
          <h3>AWS Community Builders (2024~)</h3>
        </li>
        <li>
          <h3>2025 Japan AWS Top Engineers</h3>
          <a
            href="https://aws.amazon.com/jp/blogs/psa/2025-japan-aws-top-engineers/"
            target="_blank"
            rel="noopener noreferrer"
          >
            Read the AWS announcement<span aria-hidden="true"> ↗</span>
          </a>
        </li>
        <li>
          <h3>2025 Japan All AWS Certifications Engineers</h3>
          <a
            href="https://aws.amazon.com/jp/blogs/psa/2025-japan-all-aws-certifications-engineers/"
            target="_blank"
            rel="noopener noreferrer"
          >
            Read the AWS announcement<span aria-hidden="true"> ↗</span>
          </a>
        </li>
      </ul>
    </section>
  );
}
