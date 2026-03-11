import type { StateMachineOption } from '../rive/types';

interface StateMachineSelectorProps {
  stateMachines: StateMachineOption[];
  selectedStateMachine?: string;
  onChange: (stateMachineName: string) => void;
  disabled?: boolean;
}

export function StateMachineSelector({
  stateMachines,
  selectedStateMachine,
  onChange,
  disabled,
}: StateMachineSelectorProps) {
  return (
    <section className="panel stack-gap">
      <div>
        <h2 className="panel-title">3. State Machine</h2>
        <p className="panel-caption">Pick the state machine for runtime playback. Leave it empty if the artboard has none.</p>
      </div>

      <select
        className="field"
        value={selectedStateMachine ?? ''}
        onChange={(event) => onChange(event.target.value)}
        disabled={disabled || stateMachines.length === 0}
      >
        <option value="">None</option>
        {stateMachines.map((stateMachine) => (
          <option key={stateMachine.name} value={stateMachine.name}>
            {stateMachine.name}
          </option>
        ))}
      </select>
    </section>
  );
}