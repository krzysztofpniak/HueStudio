# HueStudio

A desktop IDE for Philips Hue. HueStudio connects to a Hue bridge, lets you browse its resources, and lets you write bridge automations in **HueScript** — a small, typed, JavaScript-like language that compiles to Hue bridge state (rules, schedules, light/group actions).

Built with Electron, React, Redux-Saga and PEG.js, on top of [electron-react-boilerplate](https://github.com/electron-react-boilerplate/electron-react-boilerplate).

## Features

- **Resource browser** — sidebar listing the bridge's lights, groups, scenes, schedules, rules and sensors, with errors flagged on schedules/rules that fail to translate.
- **Resource viewer** — inspect a resource and navigate to the resources it references.
- **HueScript editor** — custom code editor with syntax highlighting, type checking and inline error messages. Files are saved as `.hue` and formatted with Prettier on save.
- **Import from bridge** — decompiles the bridge's existing rules and schedules into a HueScript file.
- **Run selection / terminal** — execute a selected snippet or type HueScript into the built-in terminal; resulting effects (on/off, brightness, color, scenes, …) are sent to the bridge.
- **AST viewer** — inspect the parsed syntax tree of the current script.
- **Color picker** — CIE xy picker constrained to the lamp's color gamut.
- **Remote auth (WIP)** — OAuth login to the Hue Remote API; the token is stored in the OS keychain via `keytar`.

## HueScript

HueScript is parsed by a PEG grammar (`app/huejs.peg`), type-checked by a small type system with polymorphic types and constraints (`app/hueScript/typeSystem`), and evaluated against a standard library (`app/hueScript/coreLib`) that produces bridge effects.

Standard library highlights:

| Area       | Functions                                                                     |
| ---------- | ----------------------------------------------------------------------------- |
| Resources  | `light`, `group`, `dimmer`, buttons (`button1`…) and events (`short_release`…) |
| Actions    | `on`, `off`, `bri`, `ct`, `xy`, `rgb`, `alert`, `transition`, `setScene`      |
| Control    | `handle`, `schedule`, `delay`, `repeat`, `condition`, `eq`                    |
| Utilities  | `map`, `tap`, `always`, `remove`, `print`, `clear`                            |

Illustrative example:

```js
dimmer(2).button1.short_release.handle(() => {
  light(12).on;
});
```

## Project structure

```
app/
  huejs.peg            HueScript grammar (compiled via pegTransformer.js)
  hueScript/           AST translation, type system, core library, bridge-state conversion
  components/Home/     main screen: sagas (file I/O, run, import), reducer, bridge data hooks
  components/          code editor, terminal, resource viewer, AST viewer, color picker, …
  color-conv/          RGB ↔ CIE xy conversion and gamut helpers
  sanctuary/           sanctuary / sanctuary-def type definitions
  api/                 minimal Hue bridge REST client
  config.js            bridge URL and Hue Remote API OAuth config (from env)
test/hueScript/        Jest unit tests for the language
```

## Getting started

Requires Node and Yarn (the `preinstall` script enforces Yarn).

```bash
yarn            # install deps, build the renderer DLL
yarn dev        # run with hot reload
```

### Configuration

Set these environment variables when launching the app (`yarn dev` / `yarn start`). They are read at runtime and are never inlined into the build, so credentials don't ship inside the packaged bundle:

| Variable              | Description                                                                              |
| --------------------- | ---------------------------------------------------------------------------------------- |
| `HUE_BRIDGE_IP`       | LAN IP of your Hue bridge                                                                |
| `HUE_BRIDGE_USERNAME` | Bridge API username (press the bridge link button, then `POST {"devicetype":"huestudio"}` to `/api`) |
| `HUE_CLIENT_SECRET`   | Hue Remote API OAuth client secret (only needed for remote auth)                         |

```bash
HUE_BRIDGE_IP=192.168.1.10 HUE_BRIDGE_USERNAME=xxxxxxxx yarn dev
```

Scripts and user preferences are stored under Electron's `userData` directory (`HueStudio/`).

## Scripts

| Command         | Description                          |
| --------------- | ------------------------------------ |
| `yarn dev`      | Start in development mode with HMR   |
| `yarn test`     | Run Jest unit tests                  |
| `yarn lint`     | ESLint                               |
| `yarn flow`     | Flow type check                      |
| `yarn build`    | Production build of main + renderer  |
| `yarn package`  | Package the app for the current OS   |

## License

MIT
