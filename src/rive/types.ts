export type PreviewFit = 'contain' | 'cover' | 'fill';
export type PlaybackState = 'playing' | 'paused' | 'stopped';
export type LogLevel = 'info' | 'error';

export const RUNTIME_EVENT_NOTE =
  'The web runtime does not expose a generic static event inventory. Events are marked only after they are observed during playback.';

export interface LoadedRiveAsset {
  buffer: ArrayBuffer;
  fileName: string;
  fileSize: number;
}

export interface RuntimeStateMachineInputContents {
  name: string;
  type: number;
  initialValue?: boolean | number;
}

export interface RuntimeStateMachineContents {
  name: string;
  inputs?: RuntimeStateMachineInputContents[];
}

export interface RuntimeArtboardContents {
  name: string;
  animations?: string[];
  stateMachines?: RuntimeStateMachineContents[];
}

export interface RuntimeContents {
  artboards?: RuntimeArtboardContents[];
}

export interface ArtboardOption {
  name: string;
  animationNames: string[];
  stateMachineNames: string[];
}

export interface StateMachineOption {
  name: string;
  inputCount: number;
}

export type LegacyInputKind = 'boolean' | 'number' | 'trigger';

export interface LegacyInputItem {
  name: string;
  type: LegacyInputKind;
  value?: boolean | number;
}

export type DataBindingKind =
  | 'boolean'
  | 'number'
  | 'string'
  | 'enum'
  | 'trigger'
  | 'color'
  | 'list'
  | 'image'
  | 'artboard'
  | 'viewModel'
  | 'unsupported';

export interface DataBindingItem {
  id: string;
  name: string;
  path: string;
  type: DataBindingKind;
  value?: string | number | boolean;
  values?: string[];
  editable: boolean;
  note?: string;
  depth: number;
  rawType?: string;
}

export interface DataBindingExtraction {
  items: DataBindingItem[];
  note?: string;
  viewModelName?: string;
  instanceName?: string;
}

export type RuntimeEventKind = 'general' | 'open-url' | 'unknown';

export interface RuntimeEventRecord {
  id: string;
  name: string;
  kind: RuntimeEventKind;
  delay?: number;
}

export interface RuntimeEventState {
  observed: boolean;
  totalObserved: number;
  lastEvent?: RuntimeEventRecord;
  recentEvents: RuntimeEventRecord[];
  note: string;
}

export interface PreviewSnapshot {
  artboards: ArtboardOption[];
  activeArtboard: string;
  stateMachines: StateMachineOption[];
  activeStateMachine?: string;
  legacyInputs: LegacyInputItem[];
  dataBindings: DataBindingExtraction;
  runtimeEvents: RuntimeEventState;
}

export interface PreviewSelection {
  artboard?: string;
  stateMachine?: string;
  fit: PreviewFit;
  autoplay?: boolean;
}

export interface LogEntry {
  id: string;
  timestamp: string;
  message: string;
  level: LogLevel;
}