import { useRef, useState, type DragEvent } from 'react';

interface FileUploadPanelProps {
  fileName?: string;
  isLoading: boolean;
  onFileSelected: (file: File) => void;
}

export function FileUploadPanel({ fileName, isLoading, onFileSelected }: FileUploadPanelProps) {
  const inputRef = useRef<HTMLInputElement | null>(null);
  const [isDragging, setIsDragging] = useState(false);

  function pickFile(file?: File) {
    if (!file) {
      return;
    }

    onFileSelected(file);
  }

  function handleDrop(event: DragEvent<HTMLDivElement>) {
    event.preventDefault();
    setIsDragging(false);
    pickFile(event.dataTransfer.files[0]);
  }

  return (
    <section className="panel stack-gap">
      <div className="panel-header-row">
        <div>
          <h2 className="panel-title">1. Load a Rive File</h2>
          <p className="panel-caption">Use this panel to upload a local `.riv` file for runtime QA.</p>
        </div>
        <button className="primary-button" onClick={() => inputRef.current?.click()} type="button" disabled={isLoading}>
          Browse .riv
        </button>
      </div>


      <div
        className={`upload-dropzone${isDragging ? ' is-dragging' : ''}`}
        onDragEnter={(event) => {
          event.preventDefault();
          setIsDragging(true);
        }}
        onDragOver={(event) => event.preventDefault()}
        onDragLeave={(event) => {
          event.preventDefault();
          setIsDragging(false);
        }}
        onDrop={handleDrop}
        role="button"
        tabIndex={0}
        onClick={() => inputRef.current?.click()}
        onKeyDown={(event) => {
          if (event.key === 'Enter' || event.key === ' ') {
            event.preventDefault();
            inputRef.current?.click();
          }
        }}
      >
        <strong>{isLoading ? 'Checking the file...' : 'Drop a .riv file here'}</strong>
        <span>{fileName ? `Current file: ${fileName}` : 'Or click this area to choose a local file'}</span>
      </div>

      <input
        ref={inputRef}
        accept=".riv"
        hidden
        type="file"
        onChange={(event) => pickFile(event.target.files?.[0])}
      />
    </section>
  );
}