# Rive Runtime Tester

Rive Runtime Tester is an internal web-based QA tool for uploaded `.riv` files. It lets developers load a local file in the browser, inspect runtime-available artboards, state machines, data binding / view model properties, runtime events, and legacy state machine inputs, then test them interactively.

The project uses React + Vite + TypeScript + `@rive-app/canvas` and is structured for static hosting, including Vercel deployment.

## Stack

- React 19
- Vite 6
- TypeScript 5
- `@rive-app/canvas` 2.35.2

## Install

```bash
npm install
```

## Run

Development server:

```bash
npm run dev
```

Production build:

```bash
npm run build
```

Preview build locally:

```bash
npm run preview
```

Default addresses:

- Dev: `http://127.0.0.1:5173`
- Preview: `http://127.0.0.1:4173`

## Usage

1. Upload a local `.riv` file from the top-left panel.
2. Review the detected top-level artboards.
3. Pick the target artboard.
4. Pick a state machine if the artboard has one.
5. Use the `Data Binding Inspector` to change runtime-editable view model values.
6. Use `Legacy Inputs` to test trigger / boolean / number inputs for older files.
7. Watch the `Selection Summary` panel for runtime event observation status while the file plays.
8. Control playback from the preview panel with `Play / Pause / Stop / Reset` and fit options.
9. Check the log panel for recent actions, including observed runtime events.

## Supported Scope

### File upload

- Local `.riv` file upload
- Drag and drop support
- File chooser button support
- Runtime parse validation during upload
- 20 MB file size cap for basic browser protection
- Uploaded file name display

### Artboards and state machines

- Top-level artboard listing based on runtime contents
- State machine listing for the selected artboard
- Safe handling when an artboard has no state machines
- Preview reinitialization when artboard or state machine changes

### Data binding / view model support

This is the primary focus of the tool.

Supported property types:

- `boolean`: checkbox toggle
- `number`: numeric input with nudge buttons
- `string`: text input
- `enum`: select box
- `trigger`: action button
- `nested view model`: path-based readout
- `color`: read-only display
- `list`: read-only length display
- `image`, `artboard`: read-only presence only

Implementation rules:

- Uses `defaultViewModel()` first
- Falls back to `viewModelByIndex(0)` when needed
- Binds a readable instance via `defaultInstance()` or `instance()` when possible
- Reads runtime property definitions from `viewModel.properties`
- Only shows values that are safely available through the runtime API

### Legacy input support

Supported legacy state machine input types:

- `Trigger`
- `Boolean`
- `Number`

Implementation rules:

- Uses `stateMachineInputs(name)` only
- Does not guess or expose unavailable inputs

### Runtime event support

- Observes runtime events through `EventType.RiveEvent`
- Marks the current selection when a runtime event has been observed during playback
- Shows the last observed event name and type in the summary panel
- Writes an event log entry whenever a runtime event is detected

Implementation rule:

- The web runtime does not expose a generic static list of all event definitions in a file, so this tool marks events after they are actually observed during playback

### Preview support

- Canvas preview for the selected artboard and state machine
- `Play / Pause / Stop / Reset`
- Fit options: `contain`, `cover`, `fill`
- Checkerboard background for transparent regions

### Logging and errors

- File upload log
- Artboard change log
- State machine change log
- Data binding change log
- Legacy input change log
- Trigger fire log
- Playback control log
- Runtime event observation log
- User-facing error banner with separate developer console output

## Security and Deployment Notes

### Browser-only file handling

- Uploaded `.riv` files are processed in browser memory only.
- The app does not upload the selected file to an application server.
- No public sample `.riv` files are bundled with the app.

### Runtime hardening

The preview runtime is configured with:

- `automaticallyHandleEvents: false`
  - Prevents runtime events from causing implicit browser side effects.
- `enableRiveAssetCDN: false`
  - Blocks automatic loading of remote Rive CDN assets.
  - Files that depend on remote assets may render with limitations.

### Vercel deployment

A `vercel.json` file is included with:

- `no-store` caching for `index.html`
- immutable caching for hashed assets
- CSP tuned for a static React + Rive runtime app
- `Referrer-Policy: no-referrer`
- `X-Content-Type-Options: nosniff`
- `X-Frame-Options: DENY`
- restrictive `Permissions-Policy`

Recommended deployment model:

- Use project-level controls if the tool should stay internal
- Keep secrets out of the client bundle
- Treat uploaded files as untrusted input
- Keep the 20 MB upload cap unless you have a measured reason to raise it

## Runtime API Coverage

This implementation only relies on runtime APIs that are directly available from `@rive-app/canvas`.

Used APIs:

- artboards: `contents.artboards`
- active artboard: `activeArtboard`
- state machines: `contents.artboards[].stateMachines`
- legacy inputs: `stateMachineInputs(name)`
- runtime events: `on(EventType.RiveEvent)`
- data binding / view model access:
  - `defaultViewModel()`
  - `viewModelByIndex()`
  - `bindViewModelInstance()`
  - `viewModel.properties`
  - `viewModelInstance.boolean()`
  - `viewModelInstance.number()`
  - `viewModelInstance.string()`
  - `viewModelInstance.enum()`
  - `viewModelInstance.trigger()`
  - `viewModelInstance.list()`
  - `viewModelInstance.color()`
  - `viewModelInstance.image()`
  - `viewModelInstance.artboard()`
  - `viewModelInstance.viewModel()`

## Limitations

### Data binding limitations

- This tool is not a replacement for the Rive editor.
- It does not reconstruct the full editor graph for bindings or state machine internals.
- It only shows runtime-safe properties and values that the web runtime can expose.

### Artboard limitations

- Artboard listing is based on `contents.artboards`, which generally exposes top-level artboards.
- Nested or bindable artboards may exist in a file without appearing in the generic selector.

### Runtime event limitations

- The tool can observe runtime events when they are emitted during playback.
- The high-level web runtime does not provide a generic public API to pre-enumerate every event definition in a `.riv` file before they fire.
- Because of that, `Runtime Events` status is based on observed playback events, not a static file inventory.

### Intentional MVP limits

- `color` is read-only
- `list` shows length only
- `image` and `artboard` properties are read-only
- Runtime min/max/step metadata is not generally available, so number editing uses a simple numeric control

## Git Hygiene

`.gitignore` is configured to exclude:

- `node_modules/`
- `dist/`
- `*.tsbuildinfo`
- local debug logs and screenshots
- `*.riv`

This means local test `.riv` files are excluded from git by default.

## Future Extensions

- multiple artboard preview
- richer view model instance selection
- saved presets
- URL-based state restore
- snapshot capture
- JSON test report export
- dedicated editors for color / list / asset properties
- richer runtime event history and filters

## Project Structure

```text
src/
  components/
    ArtboardSelector.tsx
    DataBindingInspector.tsx
    FileUploadPanel.tsx
    InfoPanel.tsx
    LegacyInputInspector.tsx
    LogPanel.tsx
    PreviewCanvas.tsx
    StateMachineSelector.tsx
  rive/
    applyDataBindingValue.ts
    createPreviewController.ts
    extractArtboards.ts
    extractDataBindings.ts
    extractLegacyInputs.ts
    extractStateMachines.ts
    loadRiveFile.ts
    types.ts
```