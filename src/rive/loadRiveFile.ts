import { RiveFile } from '@rive-app/canvas';
import type { LoadedRiveAsset } from './types';

const MAX_RIVE_FILE_BYTES = 20 * 1024 * 1024;

export async function loadRiveFile(file: File): Promise<LoadedRiveAsset> {
  if (file.size <= 0) {
    throw new Error('The selected file is empty.');
  }

  if (file.size > MAX_RIVE_FILE_BYTES) {
    throw new Error('The selected file is too large. Please use a .riv file smaller than 20 MB.');
  }

  const buffer = await file.arrayBuffer();
  const runtimeFile = new RiveFile({ buffer });

  try {
    await runtimeFile.init();
  } finally {
    runtimeFile.cleanup();
  }

  return {
    buffer,
    fileName: file.name,
    fileSize: file.size,
  };
}