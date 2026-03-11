import type { ArtboardOption } from '../rive/types';

interface ArtboardSelectorProps {
  artboards: ArtboardOption[];
  selectedArtboard?: string;
  onChange: (artboardName: string) => void;
  disabled?: boolean;
}

export function ArtboardSelector({ artboards, selectedArtboard, onChange, disabled }: ArtboardSelectorProps) {
  const detectedNames = artboards.map((artboard) => artboard.name).join(', ');

  return (
    <section className="panel stack-gap">
      <div>
        <h2 className="panel-title">2. Artboard</h2>
        <p className="panel-caption">Select the artboard that should be rendered in the preview.</p>
        {artboards.length > 0 ? (
          <p className="helper-text">
            Runtime detected {artboards.length} top-level artboard{artboards.length > 1 ? 's' : ''}: {detectedNames}
          </p>
        ) : null}
      </div>

      <select
        className="field"
        value={selectedArtboard ?? ''}
        onChange={(event) => onChange(event.target.value)}
        disabled={disabled || artboards.length === 0}
      >
        {artboards.length === 0 ? <option value="">No artboards found</option> : null}
        {artboards.map((artboard) => (
          <option key={artboard.name} value={artboard.name}>
            {artboard.name}
          </option>
        ))}
      </select>
    </section>
  );
}