import { BackLink } from "../components/Connections";

export default function SpeakingsPage(): React.JSX.Element {
  return (
    <section className="connection-content" aria-label="Speakings" tabIndex={-1}>
      <BackLink />
      <ul className="connection-list">
        <li>
          <h3>Virtual Threadsで実現する性能改善</h3>
          <iframe
            className="speakerdeck-iframe"
            src="https://speakerdeck.com/player/78bd440779044617bef46868ed5c13fd"
            title="Virtual Threadsで実現する性能改善"
            allowFullScreen
            allow="web-share"
            loading="lazy"
          />
        </li>
        <li>
          <h3>結婚式WEB招待状をAWSリソースでサクッと自作した話</h3>
          <iframe
            className="speakerdeck-iframe"
            src="https://speakerdeck.com/player/e92e57abbbd342028e47b2c1c06fd9f5"
            title="結婚式WEB招待状をAWSリソースでサクッと自作した話"
            allowFullScreen
            allow="web-share"
            loading="lazy"
          />
        </li>
        <li>
          <h3>For more slides</h3>
          <a href="https://speakerdeck.com/tttol" target="_blank" rel="noopener noreferrer">
            Browse presentations<span aria-hidden="true"> ↗</span>
          </a>
        </li>
      </ul>
    </section>
  );
}
