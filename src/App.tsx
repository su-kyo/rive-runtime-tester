import { useEffect, useRef, useState } from 'react';
import { ArtboardSelector } from './components/ArtboardSelector';
import { DataBindingInspector } from './components/DataBindingInspector';
import { FileUploadPanel } from './components/FileUploadPanel';
import { InfoPanel } from './components/InfoPanel';
import { LegacyInputInspector } from './components/LegacyInputInspector';
import { LogPanel } from './components/LogPanel';
import { PreviewCanvas } from './components/PreviewCanvas';
import { StateMachineSelector } from './components/StateMachineSelector';
import { applyDataBindingValue } from './rive/applyDataBindingValue';
import { PreviewController, createPreviewController } from './rive/createPreviewController';
import {
  RUNTIME_EVENT_NOTE,
  type ArtboardOption,
  type DataBindingExtraction,
  type DataBindingItem,
  type LegacyInputItem,
  type LoadedRiveAsset,
  type LogEntry,
  type PlaybackState,
  type PreviewFit,
  type PreviewSnapshot,
  type RuntimeEventRecord,
  type RuntimeEventState,
  type StateMachineOption,
} from './rive/types';
import { loadRiveFile } from './rive/loadRiveFile';

const MAX_LOG_ENTRIES = 80;

const EMPTY_BINDINGS: DataBindingExtraction = {
  items: [],
  note: 'Load a file to inspect the bound view model at runtime.',
};

const EMPTY_RUNTIME_EVENTS: RuntimeEventState = {
  observed: false,
  totalObserved: 0,
  recentEvents: [],
  note: RUNTIME_EVENT_NOTE,
};

function createLogEntry(message: string, level: LogEntry['level'] = 'info'): LogEntry {
  return {
    id: `${Date.now()}-${Math.random().toString(16).slice(2)}`,
    timestamp: new Intl.DateTimeFormat('en-GB', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: false,
    }).format(new Date()),
    message,
    level,
  };
}

function isRiveFile(file: File): boolean {
  return file.name.toLowerCase().endsWith('.riv');
}

function formatRuntimeEventLogMessage(event: RuntimeEventRecord): string {
  if (event.kind === 'open-url') {
    return `Runtime event observed: ${event.name} (open-url)`;
  }

  if (event.kind === 'general') {
    return `Runtime event observed: ${event.name} (general)`;
  }

  return `Runtime event observed: ${event.name}`;
}

export default function App() {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const controllerRef = useRef<PreviewController | null>(null);

  const [loadedAsset, setLoadedAsset] = useState<LoadedRiveAsset | null>(null);
  const [artboards, setArtboards] = useState<ArtboardOption[]>([]);
  const [selectedArtboard, setSelectedArtboard] = useState('');
  const [stateMachines, setStateMachines] = useState<StateMachineOption[]>([]);
  const [selectedStateMachine, setSelectedStateMachine] = useState('');
  const [legacyInputs, setLegacyInputs] = useState<LegacyInputItem[]>([]);
  const [dataBindings, setDataBindings] = useState<DataBindingExtraction>(EMPTY_BINDINGS);
  const [runtimeEvents, setRuntimeEvents] = useState<RuntimeEventState>(EMPTY_RUNTIME_EVENTS);
  const [fit, setFit] = useState<PreviewFit>('contain');
  const [playbackState, setPlaybackState] = useState<PlaybackState>('stopped');
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [errorMessage, setErrorMessage] = useState('');
  const [isBusy, setIsBusy] = useState(false);

  const fileName = loadedAsset?.fileName;

  useEffect(() => {
    if (!canvasRef.current) {
      return;
    }

    const controller = createPreviewController(canvasRef.current, {
      onRuntimeEventObserved: (event, state) => {
        setRuntimeEvents(state);
        setLogs((current) => [createLogEntry(formatRuntimeEventLogMessage(event)), ...current].slice(0, MAX_LOG_ENTRIES));
      },
    });

    controllerRef.current = controller;

    const handleResize = () => controller.resize();
    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
      controller.cleanup();
      controllerRef.current = null;
    };
  }, []);

  function getController(): PreviewController {
    if (!controllerRef.current) {
      throw new Error('Preview controller is not ready.');
    }

    return controllerRef.current;
  }

  function appendLog(message: string, level: LogEntry['level'] = 'info') {
    setLogs((current) => [createLogEntry(message, level), ...current].slice(0, MAX_LOG_ENTRIES));
  }

  function clearInspectorState() {
    setArtboards([]);
    setSelectedArtboard('');
    setStateMachines([]);
    setSelectedStateMachine('');
    setLegacyInputs([]);
    setDataBindings(EMPTY_BINDINGS);
    setRuntimeEvents(EMPTY_RUNTIME_EVENTS);
    setPlaybackState('stopped');
  }

  function applySnapshot(snapshot: PreviewSnapshot, nextPlaybackState?: PlaybackState) {
    setArtboards(snapshot.artboards);
    setSelectedArtboard(snapshot.activeArtboard);
    setStateMachines(snapshot.stateMachines);
    setSelectedStateMachine(snapshot.activeStateMachine ?? '');
    setLegacyInputs(snapshot.legacyInputs);
    setDataBindings(snapshot.dataBindings);
    setRuntimeEvents(snapshot.runtimeEvents);
    if (nextPlaybackState) {
      setPlaybackState(nextPlaybackState);
    }
  }

  async function loadIntoPreview(asset: LoadedRiveAsset, artboard?: string, stateMachine?: string, autoplay = true) {
    const snapshot = await getController().load(asset, {
      artboard,
      stateMachine,
      fit,
      autoplay,
    });

    applySnapshot(snapshot, autoplay ? 'playing' : 'stopped');
    return snapshot;
  }

  async function processRiveFile(file: File) {
    if (!isRiveFile(file)) {
      throw new Error('Please choose a .riv file.');
    }

    const asset = await loadRiveFile(file);
    setLoadedAsset(asset);

    const initialSnapshot = await loadIntoPreview(asset, undefined, undefined, true);
    const firstStateMachine = initialSnapshot.stateMachines[0]?.name;

    if (firstStateMachine) {
      await loadIntoPreview(asset, initialSnapshot.activeArtboard, firstStateMachine, true);
    }

    appendLog(`Loaded local file: ${asset.fileName}`);
  }

  async function handleFileSelected(file: File) {
    setIsBusy(true);
    setErrorMessage('');

    try {
      await processRiveFile(file);
    } catch (error) {
      console.error('Failed to load rive file', error);
      setLoadedAsset(null);
      clearInspectorState();
      setErrorMessage(error instanceof Error ? error.message : 'The file could not be loaded.');
      appendLog('Local file load failed', 'error');
    } finally {
      setIsBusy(false);
    }
  }

  async function handleArtboardChange(artboardName: string) {
    if (!loadedAsset) {
      return;
    }

    setIsBusy(true);
    setErrorMessage('');

    try {
      const nextStateMachine = artboards.find((item) => item.name === artboardName)?.stateMachineNames[0] ?? '';
      await loadIntoPreview(loadedAsset, artboardName, nextStateMachine || undefined, true);
      appendLog(`Artboard changed: ${artboardName}`);
    } catch (error) {
      console.error('Failed to change artboard', error);
      setErrorMessage('The artboard could not be changed. Please check the console for details.');
      appendLog(`Artboard change failed: ${artboardName}`, 'error');
    } finally {
      setIsBusy(false);
    }
  }

  async function handleStateMachineChange(stateMachineName: string) {
    if (!loadedAsset) {
      return;
    }

    setIsBusy(true);
    setErrorMessage('');

    try {
      await loadIntoPreview(loadedAsset, selectedArtboard || undefined, stateMachineName || undefined, true);
      appendLog(`State machine changed: ${stateMachineName || 'None'}`);
    } catch (error) {
      console.error('Failed to change state machine', error);
      setErrorMessage('The state machine could not be changed. Please check the console for details.');
      appendLog(`State machine change failed: ${stateMachineName || 'None'}`, 'error');
    } finally {
      setIsBusy(false);
    }
  }

  function syncInspectors() {
    const snapshot = getController().refresh(selectedStateMachine || undefined);
    applySnapshot(snapshot, playbackState);
  }

  function handleFitChange(nextFit: PreviewFit) {
    setFit(nextFit);
    controllerRef.current?.setFit(nextFit);
    appendLog(`Fit changed: ${nextFit}`);
  }

  function handlePlay() {
    controllerRef.current?.play();
    setPlaybackState('playing');
    appendLog('Playback started');
  }

  function handlePause() {
    controllerRef.current?.pause();
    setPlaybackState('paused');
    appendLog('Playback paused');
  }

  function handleStop() {
    controllerRef.current?.stop();
    setPlaybackState('stopped');
    appendLog('Playback stopped');
  }

  async function handleReset() {
    if (!loadedAsset) {
      return;
    }

    setIsBusy(true);
    setErrorMessage('');

    try {
      const snapshot = await getController().reset(true);
      applySnapshot(snapshot, 'playing');
      appendLog('Preview reset');
    } catch (error) {
      console.error('Failed to reset preview', error);
      setErrorMessage('The preview could not be reset. Please check the console for details.');
      appendLog('Preview reset failed', 'error');
    } finally {
      setIsBusy(false);
    }
  }

  function handleDataBindingChange(item: DataBindingItem, nextValue?: boolean | number | string) {
    const runtime = controllerRef.current?.runtime;
    if (!runtime) {
      return;
    }

    try {
      applyDataBindingValue(runtime, item, nextValue);
      syncInspectors();
      appendLog(
        item.type === 'trigger'
          ? `Data binding trigger fired: ${item.path}`
          : `Data binding changed: ${item.path} -> ${String(nextValue)}`,
      );
    } catch (error) {
      console.error('Failed to update data binding', error);
      setErrorMessage('The selected data binding property could not be updated.');
      appendLog(`Data binding change failed: ${item.path}`, 'error');
    }
  }

  function handleLegacyInputChange(input: LegacyInputItem, nextValue?: boolean | number) {
    if (!selectedStateMachine) {
      return;
    }

    try {
      getController().setLegacyInput(selectedStateMachine, input.name, input.type, nextValue);
      syncInspectors();
      appendLog(
        input.type === 'trigger'
          ? `Legacy trigger fired: ${input.name}`
          : `Legacy input changed: ${input.name} -> ${String(nextValue)}`,
      );
    } catch (error) {
      console.error('Failed to update legacy input', error);
      setErrorMessage('The selected legacy input could not be updated.');
      appendLog(`Legacy input change failed: ${input.name}`, 'error');
    }
  }

  return (
    <main className="app-shell">
      <header className="app-header">
        <div>
          <p className="eyebrow">Internal QA Tool</p>
          <h1>Rive Runtime Tester</h1>
          <p className="app-subtitle">
            Inspect runtime-accessible data bindings first, then fall back to legacy inputs when older files need coverage.
          </p>
        </div>
      </header>

      {errorMessage ? <div className="error-banner">{errorMessage}</div> : null}

      <div className="app-grid">
        <div className="left-column">
          <FileUploadPanel fileName={fileName} isLoading={isBusy} onFileSelected={handleFileSelected} />
          <ArtboardSelector
            artboards={artboards}
            selectedArtboard={selectedArtboard}
            onChange={handleArtboardChange}
            disabled={isBusy || !loadedAsset}
          />
          <StateMachineSelector
            stateMachines={stateMachines}
            selectedStateMachine={selectedStateMachine}
            onChange={handleStateMachineChange}
            disabled={isBusy || !loadedAsset}
          />
          <DataBindingInspector
            extraction={dataBindings}
            disabled={isBusy || !loadedAsset}
            onValueChange={handleDataBindingChange}
          />
          <LegacyInputInspector inputs={legacyInputs} disabled={isBusy || !loadedAsset} onChange={handleLegacyInputChange} />
          <InfoPanel
            fileName={fileName}
            artboardName={selectedArtboard}
            stateMachineName={selectedStateMachine}
            dataBindingNote={dataBindings.note}
            legacyInputCount={legacyInputs.length}
            stateMachineCount={stateMachines.length}
            runtimeEvents={runtimeEvents}
          />
        </div>

        <div className="right-column">
          <PreviewCanvas
            ref={canvasRef}
            hasFile={Boolean(loadedAsset)}
            fit={fit}
            playbackState={playbackState}
            disabled={isBusy}
            onFitChange={handleFitChange}
            onPlay={handlePlay}
            onPause={handlePause}
            onStop={handleStop}
            onReset={handleReset}
          />
          <LogPanel logs={logs} />
        </div>
      </div>
    </main>
  );
}