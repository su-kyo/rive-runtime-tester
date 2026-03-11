import { StateMachineInputType, type Rive } from '@rive-app/canvas';
import type { LegacyInputItem } from './types';

export function extractLegacyInputs(rive: Rive, stateMachineName?: string): LegacyInputItem[] {
  if (!stateMachineName) {
    return [];
  }

  return rive.stateMachineInputs(stateMachineName).map((input) => {
    if (input.type === StateMachineInputType.Boolean) {
      return {
        name: input.name,
        type: 'boolean',
        value: Boolean(input.value),
      } satisfies LegacyInputItem;
    }

    if (input.type === StateMachineInputType.Number) {
      return {
        name: input.name,
        type: 'number',
        value: Number(input.value),
      } satisfies LegacyInputItem;
    }

    return {
      name: input.name,
      type: 'trigger',
    } satisfies LegacyInputItem;
  });
}