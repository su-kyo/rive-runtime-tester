import type { LegacyInputItem } from '../rive/types';

interface LegacyInputInspectorProps {
  inputs: LegacyInputItem[];
  disabled?: boolean;
  onChange: (input: LegacyInputItem, nextValue?: boolean | number) => void;
}

export function LegacyInputInspector({ inputs, disabled, onChange }: LegacyInputInspectorProps) {
  return (
    <section className="panel stack-gap inspector-panel">
      <div>
        <h2 className="panel-title">Legacy Inputs</h2>
        <p className="panel-caption">Backward-compatible state machine inputs are listed here as a separate, lower-priority section.</p>
      </div>

      {inputs.length === 0 ? (
        <div className="empty-state">No legacy inputs are available for the selected state machine.</div>
      ) : (
        <div className="inspector-list">
          {inputs.map((input) => (
            <div className="inspector-row" key={input.name}>
              <div className="inspector-label-block">
                <div className="inspector-name-row">
                  <strong>{input.name}</strong>
                  <span className="pill">{input.type}</span>
                </div>
              </div>

              <div className="inspector-control-block">
                {input.type === 'boolean' ? (
                  <label className="toggle-field">
                    <input
                      type="checkbox"
                      checked={Boolean(input.value)}
                      disabled={disabled}
                      onChange={(event) => onChange(input, event.target.checked)}
                    />
                    <span>{String(Boolean(input.value))}</span>
                  </label>
                ) : null}

                {input.type === 'number' ? (
                  <input
                    className="field"
                    type="number"
                    value={typeof input.value === 'number' ? input.value : 0}
                    disabled={disabled}
                    onChange={(event) => onChange(input, Number(event.target.value))}
                  />
                ) : null}

                {input.type === 'trigger' ? (
                  <button className="secondary-button" type="button" disabled={disabled} onClick={() => onChange(input)}>
                    Fire
                  </button>
                ) : null}
              </div>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}