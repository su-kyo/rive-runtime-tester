import type { ArtboardOption, RuntimeContents } from './types';

export function extractArtboards(contents: RuntimeContents | undefined): ArtboardOption[] {
  return (contents?.artboards ?? []).map((artboard) => ({
    name: artboard.name,
    animationNames: artboard.animations ?? [],
    stateMachineNames: (artboard.stateMachines ?? []).map((machine) => machine.name),
  }));
}