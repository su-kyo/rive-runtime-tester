import type { LogEntry } from '../rive/types';

interface LogPanelProps {
  logs: LogEntry[];
}

export function LogPanel({ logs }: LogPanelProps) {
  return (
    <section className="panel stack-gap log-panel">
      <div>
        <h2 className="panel-title">Logs</h2>
        <p className="panel-caption">This panel records the most recent QA actions.</p>
      </div>

      {logs.length === 0 ? (
        <div className="empty-state">No events recorded yet.</div>
      ) : (
        <div className="log-list">
          {logs.map((log) => (
            <div className={`log-row ${log.level}`} key={log.id}>
              <span className="log-time">{log.timestamp}</span>
              <span>{log.message}</span>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}