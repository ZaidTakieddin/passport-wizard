# Passport Wizard

A pnpm monorepo with two React 18 + TypeScript apps built with Rsbuild and connected at runtime through Module Federation:

- **passport-form** (App A, remote) exposes a `PassportForm` component that validates itself and reports `{ valid, data }`.
- **host-app** (App B, host) loads that component into a two-step wizard, adds an ID form, and on submit produces one combined JSON payload.

## Architecture

```text
                 build time                                   runtime (browser)
┌────────────────────────────────┐               ┌───────────────────────────────────────┐
│ apps/passport-form   (remote)  │  rsbuild      │ http://localhost:3001                 │
│  exposes ./PassportForm        │ ────────────▶ │  /mf-manifest.json  /remoteEntry.js   │
│  validation + file handling    │               │  exposed chunks (JS + CSS)            │
└───────────────▲────────────────┘               └──────────────────▲────────────────────┘
                │ import type                                       │ loaded on demand
┌───────────────┴────────────────┐                                  │
│ packages/passport-contract     │               ┌──────────────────┴────────────────────┐
│  shared TypeScript types only  │               │ http://localhost:3000          (host) │
└───────────────┬────────────────┘               │  Wizard (useReducer)                  │
                │ import type                    │   Step 1: PassportForm (federated)    │
┌───────────────▼────────────────┐  rsbuild      │   Step 2: ID form (local)             │
│ apps/host-app          (host)  │ ────────────▶ │   Submit → JSON payload               │
└────────────────────────────────┘               └───────────────────────────────────────┘
```

React and ReactDOM are shared as single instances. The host provides them, and the remote reuses them.

## Repository structure

```text
apps/
  passport-form/                  App A: remote, port 3001
    rsbuild.config.ts             Module Federation remote config
    index.html                    Page template (sets <html lang>)
    src/PassportForm/             The exposed component and its internals
      PassportForm.tsx            Form setup (React Hook Form + Zod)
      DocumentField.tsx           File selection, checks, base64 reading
      validation.ts               All passport rules (single source of truth)
      useReportState.ts           Reports { valid, data } to the host
    src/App.tsx                   Standalone page for developing the remote
  host-app/                       App B: host, port 3000
    rsbuild.config.ts             Module Federation host config
    index.html                    Page template (sets <html lang>)
    public/runtime-config.json    Optional runtime override of the remote's URL
    src/remote/                   Remote loading, retry, runtime config
    src/wizard/                   Wizard reducer, UI and refresh persistence
    src/id-info/                  ID form and its rules
    src/submission/               Payload builder and result view
packages/
  passport-contract/              Types shared by both apps (no runtime code)
pnpm-workspace.yaml               Workspaces + version catalog
tsconfig.base.json                Shared strict TypeScript settings
eslint.config.js, .prettierrc.json, .editorconfig, .gitattributes
```

## Getting started

Requires **Node.js 22.12 or later** (see `.nvmrc`). pnpm is pinned to 12.8.1 through the `packageManager` field and runs through Corepack, which ships with Node.

```bash
git clone https://github.com/ZaidTakieddin/passport-wizard.git
cd passport-wizard
corepack enable        # once per machine (may need an admin terminal on Windows),
                       # or prefix each command below with "corepack"
pnpm install
pnpm dev               # starts both apps in parallel
```

Open **http://localhost:3000** for the wizard. The remote's standalone page is at http://localhost:3001.

| Command                                        | What it does                                                             |
| ---------------------------------------------- | ------------------------------------------------------------------------ |
| `pnpm dev`                                     | Runs both dev servers in parallel                                        |
| `pnpm dev:host-app` / `pnpm dev:passport-form` | Runs one app                                                             |
| `pnpm build`                                   | Production builds into each app's `dist/`                                |
| `pnpm preview`                                 | Serves both production builds on the same ports (run `pnpm build` first) |
| `pnpm typecheck`                               | `tsc --noEmit` in both apps and the contract package                     |
| `pnpm lint`                                    | ESLint across the repository                                             |
| `pnpm format` / `pnpm format:check`            | Formats with Prettier / checks formatting without writing                |

### Ports

| App           | Port | Notes                                                 |
| ------------- | ---- | ----------------------------------------------------- |
| host-app      | 3000 | `strictPort`: fails instead of moving to another port |
| passport-form | 3001 | `strictPort`: the host expects the remote here        |

### Configuration (optional)

Both configs read these from `process.env` when the dev server starts or the build runs:

| Variable                     | App           | Default                                                  |
| ---------------------------- | ------------- | -------------------------------------------------------- |
| `PASSPORT_FORM_MANIFEST_URL` | host-app      | `http://localhost:3001/mf-manifest.json`                 |
| `HOST_APP_ORIGIN`            | passport-form | `http://localhost:3000`, the only origin allowed by CORS |

- **Changing the remote's URL after a build:** set `passportFormManifestUrl` in the host's `runtime-config.json`. It's served from `public/` in development and copied into `dist/` by the build. The host reads it before rendering and registers the remote with that URL. The file is `{}` by default, which means no override.
- **CORS:** `HOST_APP_ORIGIN` sets the CORS header of the remote's dev and preview servers. In a real deployment that header comes from whatever server hosts the remote's files.

## Module Federation

Both apps use `@module-federation/rsbuild-plugin` (Module Federation 2.0).

### Host vs remote

|                            | passport-form (remote)                                                | host-app (host)                                              |
| -------------------------- | --------------------------------------------------------------------- | ------------------------------------------------------------ |
| `name`                     | `passport_form`                                                       | `host_app`                                                   |
| Role                       | Owns the passport form, its rules and file handling                   | Owns the page, wizard, ID form and payload                   |
| Config                     | `exposes`, `filename: 'remoteEntry.js'`                               | `remotes: { passport_form: 'passport_form@<manifest URL>' }` |
| `shared`                   | `react`, `react-dom`: `singleton: true`, `requiredVersion: '^18.3.1'` | same                                                         |
| `experiments.asyncStartup` | `true`                                                                | `true`                                                       |
| `dts`                      | `false`                                                               | `false`                                                      |
| Other                      | `output.assetPrefix: 'auto'`, `server.cors.origin` allowlist          | `shareStrategy: 'loaded-first'`                              |

### Exposed module

`passport_form/PassportForm` maps to `apps/passport-form/src/PassportForm/PassportForm.tsx` and is a default export.

The host loads it with the Module Federation runtime's `loadRemote('passport_form/PassportForm')`, wrapped in `React.lazy` inside `Suspense` and an error boundary (`host-app/src/remote/`). It uses `loadRemote` rather than a static `import()`:

- **Why:** the bundler's `import()` keeps a failed remote module failed for the life of the page, while the runtime makes a fresh request.
- **Result:** if the remote is down, **Try again** recovers in place once it's back, with no page reload.

### How loading works

1. The host starts with its own React. `asyncStartup` loads shared modules before app code runs.
2. Before rendering, the host applies `runtime-config.json`, if it names a different remote URL.
3. When Step 1 renders, the runtime fetches `mf-manifest.json` from :3001. This is the request CORS allows.
4. It then loads `remoteEntry.js` and the exposed chunk, and initializes the remote with the host's React. The remote's own React chunks aren't downloaded.

### Why these settings

- **`asyncStartup`:** without it, the host fails at startup (runtime error `RUNTIME-006`) because shared React isn't loaded yet.
- **`assetPrefix: 'auto'`:** without it, the production host requests the remote's chunks from its own origin.
- **`loaded-first`:** with the default `version-first`, the host fetches the remote at startup to compare versions, so a down remote leaves the whole host blank. With `loaded-first`, the host renders and the error boundary shows "The passport form couldn't be loaded" with a **Try again** button; Next stays disabled.
- **`dts: false`:** types come from `passport-contract` instead of Module Federation's type generation, which would need the remote's dev server running whenever the host type-checks.

## Integration contract

The contract lives in `packages/passport-contract/src/index.ts`. Both apps import it with `import type`, so it adds nothing to either bundle. The host types the module returned by `loadRemote` with `PassportFormProps`, so a contract change breaks the host's build, not its runtime.

### PassportForm API

```ts
interface PassportFormProps {
  onChange: (state: PassportFormState) => void; // called once after mount, then on every change
  initialValue?: PassportFormValues; // read on mount only (e.g. after Back)
}

type PassportFormState =
  | { valid: true; data: PassportData } // complete: document is never null
  | { valid: false; data: PassportFormValues }; // may be partial

interface PassportFormValues {
  passportNumber: string;
  firstName: string;
  lastName: string;
  issueDate: string; // YYYY-MM-DD or ''
  expiryDate: string; // YYYY-MM-DD or ''
  document: PassportDocument | null;
}

interface PassportData extends PassportFormValues {
  document: PassportDocument;
}

interface PassportDocument {
  fileName: string;
  mimeType: 'application/pdf' | 'image/png' | 'image/jpeg' | 'image/jpg';
  base64: string; // raw base64, no "data:...;base64," prefix
}
```

- **Data shape:** `data` always has the same keys, matching the payload's `passport` section.
- **Report frequency:** reports are compared field by field, and `onChange` fires only when something changed.
- **Callback identity:** the latest callback is kept in a ref, so a host passing a new function each render can't cause a loop.

## Validation rules

All passport rules live in the remote (`validation.ts`): one Zod schema drives both the inline errors (through React Hook Form) and the reported `valid` flag. The host never re-checks them.

| Field                   | Rule                                                                                                                                                                                            |
| ----------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Passport number         | Required. 3 to 9 characters, capital letters A–Z and digits 0–9 only ([ICAO Doc 9303](#passport-and-id-standards)). Lower case, spaces and symbols are rejected; surrounding spaces are trimmed |
| First name, last name   | Required. Trimmed; whitespace only counts as empty                                                                                                                                              |
| Issue date, expiry date | Required, complete `YYYY-MM-DD` dates                                                                                                                                                           |
| Expiry date             | Strictly after the issue date (equal dates fail). Compared as ISO strings, so no time zone shifts                                                                                               |
| Passport document       | Exactly one file. MIME type `application/pdf`, `image/png`, `image/jpeg` or `image/jpg`. Not empty. At most 5 MB. Contents must match the type                                                  |

**When errors appear:**

- Validity is recalculated on every change, from the first render.
- An error message appears once its field has been changed or left (`mode: 'all'`).
- Changing the issue date re-checks the expiry date if it already has a value.

**File checks:**

- **Before reading:** type, size and file count are checked before the file is read, because the `accept` attribute only filters the file picker.
- **After reading:** the file's first bytes must match its type (`%PDF-`, the PNG signature or the JPEG signature). The browser derives the type from the file extension, so this catches a renamed file.
- **On restore:** the schema runs the same content check on restored data.

**Host ID form** (`host-app/src/id-info/idInfo.ts`):

| Field              | Rule                                                                                                                                                         |
| ------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| Emirates ID number | Required. 15 digits starting with `784`, entered with or without dashes or spaces ([UAE format](#passport-and-id-standards)). Stored as `784-YYYY-NNNNNNN-N` |
| Nationality        | One of 10 options with ISO 3166-1 alpha-2 codes (`EG`, `IN`, `JO`, `LB`, `PK`, `PH`, `SA`, `AE`, `GB`, `US`)                                                 |

### Passport and ID standards

- **Passport number, [ICAO Doc 9303 Part 4](https://www.icao.int/sites/default/files/publications/DocSeries/9303_p4_cons_en.pdf):**
  - In the passport's machine-readable zone, the number fills positions 1–9, so it can't be longer than 9 characters.
  - The zone only allows capital A–Z and 0–9, and spaces or special characters are replaced by a filler character, so neither is part of the number. Lower-case input is rejected rather than converted, so what the user types is exactly what's submitted. The [Abu Dhabi Department of Health identifier standard](https://www.doh.gov.ae/-/media/Feature/Resources/Health-Information-Exchange-standards/Standard-1---Patient-Identifier---Emirates-ID-and-Passport.ashx) states the same: alphanumeric, with no spaces or special characters.
  - **Minimum of 3 characters:** a project rule, not part of the standard. ICAO sets no minimum.
- **Emirates ID:**
  - **Format:** `784-YYYY-NNNNNNN-N`, where 784 is the UAE's ISO 3166 numeric country code. The Abu Dhabi Department of Health standard defines it as a 15-digit number (example `784198012345678`).
  - **Year segment:** `YYYY` is usually the holder's birth year, but not always, so it's only checked as four digits.
  - **Last digit:** not checked. ICP, which issues the card, doesn't publish how it's calculated. Some third-party validators assume a Luhn checksum, but ICP hasn't confirmed it, and IDs reported as valid have failed it. Rejecting a real ID is worse than letting a typo through.

## Wizard behavior

All wizard state lives in one reducer: `host-app/src/wizard/wizardReducer.ts`.

1. **Step 1, Passport:**
   - Renders the federated form.
   - **Next** is disabled until the form reports `valid: true`. A short hint explains why, linked to the button with `aria-describedby`.
2. **Step 2, ID details:**
   - **Submit** is disabled unless the passport report is valid _and_ the ID rules pass.
   - **Back** returns to Step 1.
3. **Submit:**
   - Builds the payload and logs it to the console with `console.log`.
   - Shows it on a result screen, with base64 shortened on screen only.
   - **Start over** resets everything.

**Safeguards:**

- Transitions are also checked in the reducer: `next` and `submitted` are ignored when they aren't allowed. A disabled button isn't the only guard.
- On each step change, focus moves to the new step's heading.

## JSON payload

Built by `host-app/src/submission/buildPayload.ts`. It copies each field explicitly, so the keys and their order are exactly:

```json
{
  "passport": {
    "passportNumber": "A1234567",
    "firstName": "Ali",
    "lastName": "Hassan",
    "issueDate": "2024-01-15",
    "expiryDate": "2034-01-14",
    "document": {
      "fileName": "passport.pdf",
      "mimeType": "application/pdf",
      "base64": "<BASE64_STRING>"
    }
  },
  "idInfo": {
    "idNumber": "784-1234-5678901-2",
    "nationality": "AE"
  }
}
```

`getSubmissionPayload` only returns a payload when `passport.valid` is true, which also narrows the TypeScript type so the document can't be null, and when the ID details parse. Otherwise it returns `null` and nothing is submitted.

## State preservation

- **Passport data:**
  - Step 1 unmounts when you go to Step 2. The host keeps the last reported `{ valid, data }` in its reducer.
  - On **Back**, it renders the form again with `initialValue = data`. Every field is pre-filled.
  - The file shows as "passport.pdf (PDF)" with **Replace file** and **Remove file**, because a browser file input can't be pre-filled; the stored document is the source of truth.
  - The form reports `valid: true` on mount, so Next is enabled immediately.
- **ID values** live in the reducer too, so they survive Back and then Next.
- **The file** is read in the remote with `FileReader` and stored as `{ fileName, mimeType, base64 }`. The browser `File` object never reaches the host.
- **Page refresh** (`host-app/src/wizard/persistence.ts`):
  - **Where:** wizard state is saved to `sessionStorage`, which keeps it in this tab only and clears it when the tab closes.
  - **When:** the text fields and ID values are saved on every change; the file is saved under its own key, only when it changes.
  - **Cleared:** on Submit and on Start over.
  - **Restoring:** a refresh reopens Step 1 with everything restored. The passport form re-validates the restored data itself before Next is enabled; the host never trusts a saved `valid` flag.
  - **Large files:** browsers limit `sessionStorage` to a few megabytes. A file too large to store isn't saved and has to be chosen again after a refresh.
- **Testing the restore without the host:** the remote's standalone page has a **Remount with reported data** button.

## Assumptions

- **Files:**
  - The 5 MB limit is our choice; the assessment doesn't set one. Base64 adds about a third to the size.
  - `base64` is the raw string without the data-URL prefix, because `mimeType` is a separate field.
  - `mimeType` is the type the browser reports for the file, which it derives from the file extension. The file's first bytes must also match that type.
- **Dates:** no rules beyond "expiry after issue". Future issue dates and expired passports are accepted.
- **Text:** values are trimmed. The passport number must already be in capital letters; nothing is converted. Names have no format rules.
- **Nationality:** a curated list of 10 countries, not the full ISO list.
- **Output:** the payload is logged and displayed. Nothing is sent to a server.
- **Step 2 values:** kept when going Back and then Next again.

## Technical decisions

- **Versions:**
  - **pnpm catalog** (`pnpm-workspace.yaml`): both apps take React from one definition, so the shared singleton can't end up with two versions.
  - **React 18.3.1 pinned exactly:** the assessment requires React 18, and current Rsbuild templates default to React 19.
  - **TypeScript `~6.0.3`**: typescript-eslint doesn't support TypeScript 7 yet.
  - **`@module-federation/enhanced` pinned to exactly the plugin's version:** the host calls `loadRemote` and `registerRemotes` directly, and they must use the same runtime the build plugin injects.
- **Tooling:**
  - **ESLint 9** with typescript-eslint, React Hooks rules and jsx-a11y, plus Prettier. ESLint 9 rather than 10, because eslint-plugin-jsx-a11y doesn't support 10 yet.
  - **Line endings:** `.editorconfig` and `.gitattributes` keep LF everywhere.
- **Development reload:** the host's `dev.watchFiles` watches the remote's `src/` and reloads the host page when it changes. The remote's own hot reload doesn't reach a page that loaded it through Module Federation, and the plugin's built-in live reload depends on its type-generation pipeline, which this project doesn't use.
- **Separation of concerns:**
  - **Remote owns editing, host owns persistence.** The form keeps its own field state, and the host stores snapshots and passes `initialValue` back. No fully controlled form across the Module Federation boundary.
  - **Libraries:** React Hook Form + Zod in the remote only, where the form is complex. The two-field ID form uses a small plain function. Neither library is shared or loaded by the host.
  - **Types-only contract package** instead of Module Federation's type generation (see "Why these settings").
- **Styling:**
  - **CSS Modules** keep class names scoped.
  - The remote keeps its design values on its own root element, never `:root`, and paints its own card surface, so it reads well on any host background.
  - The remote's page styles are imported only by its standalone entry, never by the exposed module.
  - **Light and dark themes:** both apps follow the system setting (`prefers-color-scheme`). The remote's dark values are scoped to its form, like its light ones.
  - **`<html lang="en">`** comes from a minimal page template in each app. Rsbuild still injects the title, meta tags and scripts into it.
