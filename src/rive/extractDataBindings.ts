import type { Rive, ViewModel, ViewModelInstance } from '@rive-app/canvas';
import type { DataBindingExtraction, DataBindingItem } from './types';

type RuntimeViewModelProperty = {
  name: string;
  type: string;
};

function getBoundViewModel(rive: Rive): {
  viewModel: ViewModel | null;
  instance: ViewModelInstance | null;
  note?: string;
} {
  const viewModel = rive.defaultViewModel() ?? (rive.viewModelCount > 0 ? rive.viewModelByIndex(0) : null);

  if (!viewModel) {
    return {
      viewModel: null,
      instance: null,
      note: 'No default runtime view model was found for the selected artboard.',
    };
  }

  let instance = rive.viewModelInstance;
  if (!instance) {
    instance = viewModel.defaultInstance() ?? viewModel.instance();
    if (instance) {
      rive.bindViewModelInstance(instance);
    }
  }

  if (!instance) {
    return {
      viewModel,
      instance: null,
      note: 'A view model was found, but a readable instance could not be created or bound.',
    };
  }

  return { viewModel, instance };
}

function normalizePropertyType(value: unknown): string {
  return typeof value === 'string' ? value.toLowerCase() : String(value ?? 'unknown').toLowerCase();
}

function createBaseItem(
  runtimePath: string,
  name: string,
  type: DataBindingItem['type'],
  depth: number,
  rawType: string,
): Pick<DataBindingItem, 'id' | 'path' | 'name' | 'type' | 'depth' | 'rawType'> {
  return {
    id: runtimePath,
    path: runtimePath,
    name,
    type,
    depth,
    rawType,
  };
}

function collectItems(
  instance: ViewModelInstance,
  properties: RuntimeViewModelProperty[],
  runtimePrefix = '',
  depth = 0,
  visited = new Set<string>(),
): DataBindingItem[] {
  const items: DataBindingItem[] = [];

  for (const property of properties) {
    const runtimePath = runtimePrefix ? `${runtimePrefix}/${property.name}` : property.name;
    const lookupPath = property.name;
    const rawType = normalizePropertyType(property.type);
    if (visited.has(runtimePath)) {
      continue;
    }

    visited.add(runtimePath);

    try {
      if (rawType === 'boolean') {
        const target = instance.boolean(lookupPath);
        items.push({
          ...createBaseItem(runtimePath, property.name, 'boolean', depth, rawType),
          editable: Boolean(target),
          value: target?.value,
          note: target ? undefined : 'The boolean property instance could not be read.',
        });
        continue;
      }

      if (rawType === 'number') {
        const target = instance.number(lookupPath);
        items.push({
          ...createBaseItem(runtimePath, property.name, 'number', depth, rawType),
          editable: Boolean(target),
          value: target?.value,
          note: target ? undefined : 'The number property instance could not be read.',
        });
        continue;
      }

      if (rawType === 'string') {
        const target = instance.string(lookupPath);
        items.push({
          ...createBaseItem(runtimePath, property.name, 'string', depth, rawType),
          editable: Boolean(target),
          value: target?.value,
          note: target ? undefined : 'The string property instance could not be read.',
        });
        continue;
      }

      if (rawType === 'enum') {
        const target = instance.enum(lookupPath);
        items.push({
          ...createBaseItem(runtimePath, property.name, 'enum', depth, rawType),
          editable: Boolean(target),
          value: target?.value,
          values: target?.values ?? [],
          note: target ? undefined : 'The enum property instance could not be read.',
        });
        continue;
      }

      if (rawType === 'trigger') {
        const target = instance.trigger(lookupPath);
        items.push({
          ...createBaseItem(runtimePath, property.name, 'trigger', depth, rawType),
          editable: Boolean(target),
          note: target ? undefined : 'The trigger property instance could not be read.',
        });
        continue;
      }

      if (rawType === 'color') {
        const target = instance.color(lookupPath);
        items.push({
          ...createBaseItem(runtimePath, property.name, 'color', depth, rawType),
          editable: false,
          value: target?.value,
          note: target
            ? 'Color values are visible at runtime, but this MVP keeps them read-only.'
            : 'The color property instance could not be read.',
        });
        continue;
      }

      if (rawType === 'list') {
        const target = instance.list(lookupPath);
        items.push({
          ...createBaseItem(runtimePath, property.name, 'list', depth, rawType),
          editable: false,
          value: target?.length,
          note: target
            ? 'List properties show only their length in this MVP.'
            : 'The list property instance could not be read.',
        });
        continue;
      }

      if (rawType === 'image') {
        const target = instance.image(lookupPath);
        items.push({
          ...createBaseItem(runtimePath, property.name, 'image', depth, rawType),
          editable: false,
          note: target
            ? 'Image properties are present at runtime, but this MVP keeps them read-only.'
            : 'The image property instance could not be read.',
        });
        continue;
      }

      if (rawType === 'artboard') {
        const target = instance.artboard(lookupPath);
        items.push({
          ...createBaseItem(runtimePath, property.name, 'artboard', depth, rawType),
          editable: false,
          note: target
            ? 'Artboard properties are present at runtime, but this MVP keeps them read-only.'
            : 'The artboard property instance could not be read.',
        });
        continue;
      }

      const nested = instance.viewModel(lookupPath);
      if (nested) {
        items.push({
          ...createBaseItem(runtimePath, property.name, 'viewModel', depth, rawType),
          editable: false,
          note: 'Nested view model group.',
        });
        items.push(
          ...collectItems(
            nested,
            nested.properties as unknown as RuntimeViewModelProperty[],
            runtimePath,
            depth + 1,
            visited,
          ),
        );
        continue;
      }

      items.push({
        ...createBaseItem(runtimePath, property.name, 'unsupported', depth, rawType),
        editable: false,
        note: `This runtime property type is not supported by the current inspector: ${rawType}`,
      });
    } catch (error) {
      console.error(`Failed to inspect data binding property: ${runtimePath}`, error);
      items.push({
        ...createBaseItem(runtimePath, property.name, 'unsupported', depth, rawType),
        editable: false,
        note: 'The property was skipped because runtime inspection failed.',
      });
    }
  }

  return items;
}

export function extractDataBindings(rive: Rive): DataBindingExtraction {
  const { viewModel, instance, note } = getBoundViewModel(rive);

  if (!viewModel || !instance) {
    return {
      items: [],
      viewModelName: viewModel?.name,
      note,
    };
  }

  const items = collectItems(instance, viewModel.properties as unknown as RuntimeViewModelProperty[]);

  return {
    items,
    viewModelName: viewModel.name,
    note:
      items.length > 0
        ? 'Only runtime-safe, readable view model properties are shown here. Editor-only metadata and hidden graph details are intentionally excluded.'
        : 'No runtime-exposed properties were found on the bound view model.',
  };
}