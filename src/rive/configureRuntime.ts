import { RuntimeLoader } from '@rive-app/canvas';
import riveWasmUrl from '@rive-app/canvas/rive.wasm?url';

let configured = false;

export function configureRiveRuntime(): void {
  if (configured) {
    return;
  }

  RuntimeLoader.setWasmUrl(riveWasmUrl);
  configured = true;
}
