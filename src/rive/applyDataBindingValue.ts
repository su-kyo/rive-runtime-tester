import type { Rive } from '@rive-app/canvas';
import type { DataBindingItem } from './types';

export function applyDataBindingValue(
  rive: Rive,
  item: DataBindingItem,
  nextValue?: boolean | number | string,
): void {
  const instance = rive.viewModelInstance;

  if (!instance) {
    throw new Error('No bound view model instance is available.');
  }

  if (item.type === 'boolean') {
    const target = instance.boolean(item.path);
    if (!target) {
      throw new Error(`Boolean property not found: ${item.path}`);
    }
    target.value = Boolean(nextValue);
    return;
  }

  if (item.type === 'number') {
    const numericValue = typeof nextValue === 'number' ? nextValue : Number(nextValue);
    if (!Number.isFinite(numericValue)) {
      throw new Error(`Invalid number value for ${item.path}`);
    }

    const target = instance.number(item.path);
    if (!target) {
      throw new Error(`Number property not found: ${item.path}`);
    }
    target.value = numericValue;
    return;
  }

  if (item.type === 'string') {
    const target = instance.string(item.path);
    if (!target) {
      throw new Error(`String property not found: ${item.path}`);
    }
    target.value = String(nextValue ?? '');
    return;
  }

  if (item.type === 'enum') {
    const target = instance.enum(item.path);
    if (!target) {
      throw new Error(`Enum property not found: ${item.path}`);
    }
    target.value = String(nextValue ?? '');
    return;
  }

  if (item.type === 'trigger') {
    const target = instance.trigger(item.path);
    if (!target) {
      throw new Error(`Trigger property not found: ${item.path}`);
    }
    target.trigger();
    return;
  }

  throw new Error(`Unsupported data binding type for editing: ${item.type}`);
}