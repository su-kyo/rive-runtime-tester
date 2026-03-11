import type { RuntimeEventState } from '../rive/types';

interface InfoPanelProps {
  fileName?: string;
  artboardName?: string;
  stateMachineName?: string;
  dataBindingNote?: string;
  legacyInputCount: number;
  stateMachineCount: number;
  runtimeEvents: RuntimeEventState;
}

function formatRuntimeEventStatus(runtimeEvents: RuntimeEventState): string {
  if (!runtimeEvents.observed) {
    return 'Not observed yet';
  }

  return `Observed (${runtimeEvents.totalObserved})`;
}

export function InfoPanel({
  fileName,
  artboardName,
  stateMachineName,
  dataBindingNote,
  legacyInputCount,
  stateMachineCount,
  runtimeEvents,
}: InfoPanelProps) {
  return (
    <section className="panel stack-gap">
      <div>
        <h2 className="panel-title">Selection Summary</h2>
        <p className="panel-caption">This panel helps QA verify exactly what is loaded right now.</p>
      </div>

      <dl className="info-grid">
        <div>
          <dt>File</dt>
          <dd>{fileName ?? '-'}</dd>
        </div>
        <div>
          <dt>Artboard</dt>
          <dd>{artboardName || '-'}</dd>
        </div>
        <div>
          <dt>State Machine</dt>
          <dd>{stateMachineName || 'None'}</dd>
        </div>
        <div>
          <dt>Runtime Events</dt>
          <dd>{formatRuntimeEventStatus(runtimeEvents)}</dd>
        </div>
      </dl>

      {runtimeEvents.lastEvent ? (
        <p className="helper-text">
          Last runtime event: {runtimeEvents.lastEvent.name} ({runtimeEvents.lastEvent.kind})
        </p>
      ) : null}
      {runtimeEvents.note ? <p className="helper-text">{runtimeEvents.note}</p> : null}
      {stateMachineCount === 0 ? <p className="helper-text">No state machine was found on the selected artboard.</p> : null}
      {legacyInputCount === 0 ? <p className="helper-text">No legacy inputs are available for the current selection.</p> : null}
      {dataBindingNote ? <p className="helper-text">{dataBindingNote}</p> : null}
    </section>
  );
}