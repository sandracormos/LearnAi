type ConnectionErrorPageProps = {
  service: 'Firebase' | 'OpenAI';
  message: string;
  onRetry?: () => void;
  onHome: () => void;
};

export function ConnectionErrorPage({ service, message, onRetry, onHome }: ConnectionErrorPageProps) {
  return (
    <main className="connection-error-page">
      <section className="connection-error-card">
        <div className="connection-error-animation" aria-hidden="true">
          <strong>404</strong>
        </div>

        <div className="connection-error-copy">
          <p className="eyebrow">{service} connection problem</p>
          <h1>Looks like the connection got lost.</h1>
          <p>{message}</p>
          <div className="connection-error-actions">
            {onRetry && <button type="button" onClick={onRetry}>Try again</button>}
            <button className="secondary" type="button" onClick={onHome}>Go to home</button>
          </div>
        </div>
      </section>
    </main>
  );
}
