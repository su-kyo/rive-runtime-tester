import type { RuntimeContents, StateMachineOption } from './types';

export function extractStateMachines(
  contents: RuntimeContents | undefined,
  artboardName: string,
): StateMachineOption[] {
  const artboard = (contents?.artboards ?? []).find((item) => item.name === artboardName);

  return (artboard?.stateMachines ?? []).map((machine) => ({
    name: machine.name,
    inputCount: machine.inputs?.length ?? 0,
  }));
}