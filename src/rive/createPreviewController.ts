import { Alignment, EventType, Fit, Layout, Rive, RiveEventType } from '@rive-app/canvas';
import type { Event as RiveRuntimeEventEnvelope, RiveEventPayload } from '@rive-app/canvas';
import { extractArtboards } from './extractArtboards';
import { extractDataBindings } from './extractDataBindings';
import { extractLegacyInputs } from './extractLegacyInputs';
import { extractStateMachines } from './extractStateMachines';
import {
  RUNTIME_EVENT_NOTE,
  type LoadedRiveAsset,
  type LegacyInputKind,
  type PreviewFit,
  type PreviewSelection,
  type PreviewSnapshot,
  type RuntimeContents,
  type RuntimeEventKind,
  type RuntimeEventRecord,
  type RuntimeEventState,
} from './types';

export interface PreviewControllerOptions {
  onRuntimeEventObserved?: (event: RuntimeEventRecord, state: RuntimeEventState) => void;
}

function toRuntimeFit(fit: PreviewFit): Fit {
  if (fit === 'cover') {
    return Fit.Cover;
  }

  if (fit === 'fill') {
    return Fit.Fill;
  }

  return Fit.Contain;
}

function createLayout(fit: PreviewFit): Layout {
  return new Layout({
    fit: toRuntimeFit(fit),
    alignment: Alignment.Center,
  });
}

function createEmptyRuntimeEventState(): RuntimeEventState {
  return {
    observed: false,
    totalObserved: 0,
    recentEvents: [],
    note: RUNTIME_EVENT_NOTE,
  };
}

function detectRuntimeEventKind(payload: RiveEventPayload): RuntimeEventKind {
  if (payload.type === RiveEventType.General) {
    return 'general';
  }

  if (payload.type === RiveEventType.OpenUrl) {
    return 'open-url';
  }

  return 'unknown';
}

function toRuntimeEventRecord(runtimeEvent: RiveRuntimeEventEnvelope): RuntimeEventRecord | null {
  if (!runtimeEvent.data || typeof runtimeEvent.data !== 'object') {
    return null;
  }

  const payload = runtimeEvent.data as RiveEventPayload;
  if (!('name' in payload) || typeof payload.name !== 'string') {
    return null;
  }

  return {
    id: `${Date.now()}-${Math.random().toString(16).slice(2)}`,
    name: payload.name,
    kind: detectRuntimeEventKind(payload),
    delay: typeof payload.delay === 'number' ? payload.delay : undefined,
  };
}

export class PreviewController {
  private canvas: HTMLCanvasElement;
  private rive: Rive | null = null;
  private asset: LoadedRiveAsset | null = null;
  private selection: PreviewSelection = {
    fit: 'contain',
    autoplay: true,
  };
  private loadToken = 0;
  private runtimeEvents: RuntimeEventState = createEmptyRuntimeEventState();
  private onRuntimeEventObserved?: (event: RuntimeEventRecord, state: RuntimeEventState) => void;

  constructor(canvas: HTMLCanvasElement, options: PreviewControllerOptions = {}) {
    this.canvas = canvas;
    this.onRuntimeEventObserved = options.onRuntimeEventObserved;
  }

  get runtime(): Rive | null {
    return this.rive;
  }


  async load(asset: LoadedRiveAsset, selection: PreviewSelection): Promise<PreviewSnapshot> {
    this.asset = asset;
    this.selection = selection;
    this.loadToken += 1;
    this.runtimeEvents = createEmptyRuntimeEventState();
    const currentToken = this.loadToken;

    this.cleanupRuntime();

    return new Promise<PreviewSnapshot>((resolve, reject) => {
      const nextRive = new Rive({
        canvas: this.canvas,
        buffer: asset.buffer.slice(0),
        artboard: selection.artboard,
        stateMachines: selection.stateMachine ? selection.stateMachine : undefined,
        autoplay: selection.autoplay ?? true,
        autoBind: true,
        layout: createLayout(selection.fit),
        automaticallyHandleEvents: false,
        enableRiveAssetCDN: false,
        onLoad: () => {
          if (currentToken !== this.loadToken) {
            nextRive.cleanup();
            return;
          }

          this.rive = nextRive;
          this.resize();
          resolve(this.inspect(selection.stateMachine));
        },
        onLoadError: () => {
          if (currentToken !== this.loadToken) {
            return;
          }

          const error = new Error('The Rive file could not be loaded. It may be unsupported, corrupted, or depend on blocked remote assets.');
          this.cleanupRuntime();
          reject(error);
        },
      });

      nextRive.on(EventType.RiveEvent, (runtimeEvent) => {
        const observedEvent = toRuntimeEventRecord(runtimeEvent);
        if (!observedEvent) {
          return;
        }

        this.runtimeEvents = {
          observed: true,
          totalObserved: this.runtimeEvents.totalObserved + 1,
          lastEvent: observedEvent,
          recentEvents: [observedEvent, ...this.runtimeEvents.recentEvents].slice(0, 10),
          note: RUNTIME_EVENT_NOTE,
        };

        this.onRuntimeEventObserved?.(observedEvent, this.runtimeEvents);
      });

      this.rive = nextRive;
    });
  }

  inspect(stateMachineName?: string): PreviewSnapshot {
    if (!this.rive) {
      throw new Error('Rive runtime is not loaded.');
    }

    const contents = this.rive.contents as RuntimeContents;
    const artboards = extractArtboards(contents);
    const activeArtboard = this.rive.activeArtboard || artboards[0]?.name || '';
    const stateMachines = extractStateMachines(contents, activeArtboard);
    const activeStateMachine = stateMachineName && stateMachines.some((item) => item.name === stateMachineName)
      ? stateMachineName
      : undefined;

    return {
      artboards,
      activeArtboard,
      stateMachines,
      activeStateMachine,
      legacyInputs: extractLegacyInputs(this.rive, activeStateMachine),
      dataBindings: extractDataBindings(this.rive),
      runtimeEvents: this.runtimeEvents,
    };
  }

  refresh(stateMachineName?: string): PreviewSnapshot {
    return this.inspect(stateMachineName);
  }

  resize(): void {
    if (!this.rive) {
      return;
    }

    this.rive.resizeDrawingSurfaceToCanvas();
  }

  setFit(fit: PreviewFit): void {
    this.selection = {
      ...this.selection,
      fit,
    };

    if (!this.rive) {
      return;
    }

    this.rive.layout = createLayout(fit);
    this.resize();
  }

  play(): void {
    this.rive?.play();
  }

  pause(): void {
    this.rive?.pause();
  }

  stop(): void {
    this.rive?.stop();
  }

  async reset(autoplay = true): Promise<PreviewSnapshot> {
    if (!this.asset) {
      throw new Error('No file is loaded.');
    }

    return this.load(this.asset, {
      ...this.selection,
      autoplay,
    });
  }

  setLegacyInput(
    stateMachineName: string,
    inputName: string,
    inputType: LegacyInputKind,
    nextValue?: boolean | number,
  ): void {
    if (!this.rive) {
      throw new Error('Rive runtime is not loaded.');
    }

    const target = this.rive.stateMachineInputs(stateMachineName).find((item) => item.name === inputName);

    if (!target) {
      throw new Error(`State machine input not found: ${inputName}`);
    }

    if (inputType === 'trigger') {
      target.fire();
      return;
    }

    target.value = nextValue as boolean | number;
  }

  cleanup(): void {
    this.loadToken += 1;
    this.cleanupRuntime();
    this.asset = null;
    this.runtimeEvents = createEmptyRuntimeEventState();
  }

  private cleanupRuntime(): void {
    if (!this.rive) {
      return;
    }

    this.rive.removeAllRiveEventListeners();
    this.rive.cleanup();
    this.rive = null;
  }
}

export function createPreviewController(canvas: HTMLCanvasElement, options?: PreviewControllerOptions): PreviewController {
  return new PreviewController(canvas, options);
}