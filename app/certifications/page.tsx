import { BackLink } from "../components/Connections";
import "./certifications.css";

export default function CertificationsPage(): React.JSX.Element {
  return (
    <section className="connection-content" aria-labelledby="connection-heading" tabIndex={-1}>
      <BackLink />
      <p className="connection-content__eyebrow">Certifications</p>
      <h2 id="connection-heading">Certifications</h2>
      <p className="connection-content__description">
        <a
          className="certifications__badges"
          href="https://www.credly.com/users/toru-takahashi.7af24a2f"
          target="_blank"
          rel="noopener noreferrer"
        >
          Badge<span aria-hidden="true"> ↗</span>
        </a>
      </p>
      <table className="certifications-table" aria-labelledby="connection-heading">
        <thead>
          <tr>
            <th scope="col">Name</th>
            <th scope="col">Date Completed</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td>AWS Certified Data Engineer – Associate</td>
            <td>2025/03</td>
          </tr>
          <tr>
            <td>AWS Certified AI Practitioner</td>
            <td>2025/03</td>
          </tr>
          <tr>
            <td>AWS Certified Machine Learning Engineer – Associate</td>
            <td>2025/03</td>
          </tr>
          <tr>
            <td>AWS Certified Machine Learning – Specialty</td>
            <td>2025/03</td>
          </tr>
          <tr>
            <td>AWS Certified Advanced Networking – Specialty</td>
            <td>2025/03</td>
          </tr>
          <tr>
            <td>AWS Certified Security – Specialty</td>
            <td>2025/02</td>
          </tr>
          <tr>
            <td>AWS Certified Developer – Associate</td>
            <td>2025/02</td>
          </tr>
          <tr>
            <td>AWS Certified Cloud Practitioner</td>
            <td>2025/02</td>
          </tr>
          <tr>
            <td>AWS Certified SysOps Administrator – Associate</td>
            <td>2025/02</td>
          </tr>
          <tr>
            <td>AWS Certified Solutions Architect – Associate</td>
            <td>2025/01</td>
          </tr>
          <tr>
            <td>AWS Certified DevOps Engineer – Professional</td>
            <td>2025/01</td>
          </tr>
          <tr>
            <td>AWS Certified Solutions Architect – Professional</td>
            <td>2025/01</td>
          </tr>
          <tr>
            <td>応用情報技術者</td>
            <td>2021/06</td>
          </tr>
          <tr>
            <td>AWS Certified Solution Architect Associate(Updated at 2025/02)</td>
            <td>2021/02</td>
          </tr>
          <tr>
            <td>Java SE Silver</td>
            <td>2020/11</td>
          </tr>
          <tr>
            <td>基本情報技術者</td>
            <td>2019/05</td>
          </tr>
          <tr>
            <td>TOEIC 740点</td>
            <td>2018/12</td>
          </tr>
        </tbody>
      </table>
    </section>
  );
}
