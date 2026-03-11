import { forwardRef } from 'react';
import type { PlaybackState, PreviewFit } from '../rive/types';

interface PreviewCanvasProps {
  hasFile: boolean;
  fit: PreviewFit;
  playbackState: PlaybackState;
  disabled?: boolean;
  onFitChange: (fit: PreviewFit) => void;
  onPlay: () => void;
  onPause: () => void;
  onStop: () => void;
  onReset: () => void;
}

export const PreviewCanvas = forwardRef<HTMLCanvasElement, PreviewCanvasProps>(function PreviewCanvas(
  { hasFile, fit, playbackState, disabled, onFitChange, onPlay, onPause, onStop, onReset },
  ref,
) {
  return (
    <section className="panel preview-panel">
      <div className="preview-toolbar">
        <div>
          <h2 className="panel-title">Preview</h2>
          <p className="panel-caption">The runtime preview reflects the selected artboard and state machine.</p>
        </div>

        <div className="preview-toolbar-actions">
          <select className="field fit-select" value={fit} onChange={(event) => onFitChange(event.target.value as PreviewFit)}>
            <option value="contain">contain</option>
            <option value="cover">cover</option>
            <option value="fill">fill</option>
          </select>
          <button className="secondary-button" type="button" disabled={disabled || !hasFile} onClick={onPlay}>
            Play
          </button>
          <button className="secondary-button" type="button" disabled={disabled || !hasFile} onClick={onPause}>
            Pause
          </button>
          <button className="secondary-button" type="button" disabled={disabled || !hasFile} onClick={onStop}>
            Stop
          </button>
          <button className="primary-button" type="button" disabled={disabled || !hasFile} onClick={onReset}>
            Reset
          </button>
        </div>
      </div>

      <div className="preview-status-row">
        <span className="pill">{playbackState}</span>
        <span className="panel-caption">The checkerboard background helps reveal transparent regions.</span>
      </div>

      <div className="canvas-shell">
        <canvas ref={ref} className="preview-canvas" />
        {!hasFile ? <div className="canvas-overlay">Use the upload panel to load a `.riv` file.</div> : null}
      </div>
    </section>
  );
});