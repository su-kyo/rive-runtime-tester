import { useEffect, useState } from 'react';
import type { DataBindingExtraction, DataBindingItem } from '../rive/types';

interface DataBindingInspectorProps {
  extraction: DataBindingExtraction;
  disabled?: boolean;
  onValueChange: (item: DataBindingItem, nextValue?: boolean | number | string) => void;
}

function isInteractive(item: DataBindingItem): boolean {
  return ['boolean', 'number', 'string', 'enum', 'trigger'].includes(item.type);
}

function formatColor(value?: string | number | boolean): string {
  if (typeof value !== 'number') {
    return '-';
  }

  return `0x${value.toString(16).padStart(8, '0').toUpperCase()}`;
}

function formatPath(path: string): string {
  return path.replaceAll('/', ' / ');
}

interface DataBindingControlRowProps {
  item: DataBindingItem;
  disabled?: boolean;
  onValueChange: (item: DataBindingItem, nextValue?: boolean | number | string) => void;
}

function DataBindingControlRow({ item, disabled, onValueChange }: DataBindingControlRowProps) {
  const [numberDraft, setNumberDraft] = useState(() => (typeof item.value === 'number' ? String(item.value) : '0'));
  const [stringDraft, setStringDraft] = useState(() => (typeof item.value === 'string' ? item.value : ''));

  useEffect(() => {
    if (item.type === 'number') {
      setNumberDraft(typeof item.value === 'number' ? String(item.value) : '0');
    }

    if (item.type === 'string') {
      setStringDraft(typeof item.value === 'string' ? item.value : '');
    }
  }, [item.type, item.value, item.id]);

  function commitNumber(nextDraft?: string) {
    const valueToParse = nextDraft ?? numberDraft;
    const nextNumber = Number(valueToParse);
    if (!Number.isFinite(nextNumber)) {
      return;
    }

    setNumberDraft(String(nextNumber));
    onValueChange(item, nextNumber);
  }

  function nudgeNumber(delta: number) {
    const currentValue = Number(numberDraft);
    const safeCurrentValue = Number.isFinite(currentValue)
      ? currentValue
      : typeof item.value === 'number'
        ? item.value
        : 0;
    const nextValue = safeCurrentValue + delta;
    setNumberDraft(String(nextValue));
    onValueChange(item, nextValue);
  }

  return (
    <div className={`inspector-row ${isInteractive(item) ? 'is-interactive' : ''}`} key={item.id} style={{ paddingLeft: `${16 + item.depth * 14}px` }}>
      <div className="inspector-label-block">
        <div className="inspector-name-row">
          <strong>{formatPath(item.path)}</strong>
          <span className="pill">{item.type}</span>
          {item.editable ? <span className="pill emphasis-pill">editable</span> : null}
          {item.rawType && item.rawType !== item.type ? <span className="pill">raw: {item.rawType}</span> : null}
        </div>
        {item.note ? <span className="inspector-note">{item.note}</span> : null}
      </div>

      <div className="inspector-control-block">
        {item.type === 'boolean' ? (
          <label className="toggle-field">
            <input
              type="checkbox"
              checked={Boolean(item.value)}
              disabled={disabled || !item.editable}
              onChange={(event) => onValueChange(item, event.target.checked)}
            />
            <span>{String(Boolean(item.value))}</span>
          </label>
        ) : null}

        {item.type === 'number' ? (
          <div className="control-stack">
            <div className="number-control-row">
              <button
                className="nudge-button"
                type="button"
                disabled={disabled || !item.editable}
                onClick={() => nudgeNumber(-1)}
              >
                -1
              </button>
              <input
                className="field"
                type="number"
                step="any"
                value={numberDraft}
                disabled={disabled || !item.editable}
                onChange={(event) => setNumberDraft(event.target.value)}
                onBlur={() => commitNumber()}
                onKeyDown={(event) => {
                  if (event.key === 'Enter') {
                    commitNumber();
                  }
                }}
              />
              <button
                className="nudge-button"
                type="button"
                disabled={disabled || !item.editable}
                onClick={() => nudgeNumber(1)}
              >
                +1
              </button>
            </div>
            <button
              className="secondary-button mini-button"
              type="button"
              disabled={disabled || !item.editable}
              onClick={() => commitNumber()}
            >
              Apply number
            </button>
          </div>
        ) : null}

        {item.type === 'string' ? (
          <div className="control-stack">
            <input
              className="field"
              type="text"
              value={stringDraft}
              disabled={disabled || !item.editable}
              onChange={(event) => setStringDraft(event.target.value)}
              onBlur={() => onValueChange(item, stringDraft)}
              onKeyDown={(event) => {
                if (event.key === 'Enter') {
                  onValueChange(item, stringDraft);
                }
              }}
            />
            <button
              className="secondary-button mini-button"
              type="button"
              disabled={disabled || !item.editable}
              onClick={() => onValueChange(item, stringDraft)}
            >
              Apply text
            </button>
          </div>
        ) : null}

        {item.type === 'enum' ? (
          <select
            className="field"
            value={typeof item.value === 'string' ? item.value : ''}
            disabled={disabled || !item.editable}
            onChange={(event) => onValueChange(item, event.target.value)}
          >
            {item.values?.map((value) => (
              <option key={value} value={value}>
                {value}
              </option>
            ))}
          </select>
        ) : null}

        {item.type === 'trigger' ? (
          <button
            className="primary-button"
            type="button"
            disabled={disabled || !item.editable}
            onClick={() => onValueChange(item)}
          >
            Run trigger
          </button>
        ) : null}

        {item.type === 'color' ? <div className="read-only-value">{formatColor(item.value)}</div> : null}
        {item.type === 'list' ? <div className="read-only-value">length: {String(item.value ?? 0)}</div> : null}
        {item.type === 'image' ? <div className="read-only-value">image property</div> : null}
        {item.type === 'artboard' ? <div className="read-only-value">artboard property</div> : null}
        {item.type === 'viewModel' ? <div className="read-only-value">nested view model group</div> : null}
        {item.type === 'unsupported' ? <div className="read-only-value">runtime limitation</div> : null}
      </div>
    </div>
  );
}

export function DataBindingInspector({ extraction, disabled, onValueChange }: DataBindingInspectorProps) {
  const interactiveItems = extraction.items.filter((item) => isInteractive(item));
  const readOnlyItems = extraction.items.filter((item) => !isInteractive(item));

  return (
    <section className="panel stack-gap inspector-panel">
      <div>
        <h2 className="panel-title">4. Data Binding Inspector</h2>
        <p className="panel-caption">Runtime-editable view model controls appear here. Triggers render as buttons and numbers can be changed directly.</p>
      </div>

      <div className="panel-meta inspector-summary-row">
        <span>View model: {extraction.viewModelName ?? 'None'}</span>
        <span className="pill emphasis-pill">interactive: {interactiveItems.length}</span>
        <span className="pill">read-only: {readOnlyItems.length}</span>
      </div>

      {extraction.note ? <p className="helper-text">{extraction.note}</p> : null}

      <div className="inspector-section">
        <div className="inspector-section-title">Interactive controls</div>
        {interactiveItems.length === 0 ? (
          <div className="empty-state">No editable boolean, number, string, enum, or trigger properties were found for the current runtime binding.</div>
        ) : (
          <div className="inspector-list">
            {interactiveItems.map((item) => (
              <DataBindingControlRow key={item.id} item={item} disabled={disabled} onValueChange={onValueChange} />
            ))}
          </div>
        )}
      </div>

      {readOnlyItems.length > 0 ? (
        <details className="inspector-section muted-section">
          <summary className="inspector-section-title">Read-only runtime metadata</summary>
          <div className="inspector-list details-list">
            {readOnlyItems.map((item) => (
              <DataBindingControlRow key={item.id} item={item} disabled={disabled} onValueChange={onValueChange} />
            ))}
          </div>
        </details>
      ) : null}
    </section>
  );
}