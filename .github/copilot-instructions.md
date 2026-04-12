# Copilot Instructions for ArknightNexus

## Project Overview

- **ArknightNexus** is a Tauri + Vue 3 desktop app for Arknights players, providing character info, enemy data, and planning tools.
- The project is a hybrid Rust (backend, Tauri) and TypeScript/Vue (frontend) monorepo.

## Architecture & Key Directories

- `src/` — Vue 3 SPA frontend (main entry: `App.vue`, `main.ts`).
- `src-tauri/` — Rust backend for Tauri (main entry: `main.rs`, config: `tauri.conf.json`).
- `public/` — Static assets for the frontend.
- `icons/` — App and platform-specific icons.
- `vite.config.ts` — Vite config, customized for Tauri (see port, HMR, and platform-specific build targets).

## Developer Workflows

- **Build (frontend only):**
  - `pnpm build` (outputs to `dist/`)
- **Tauri build (full app):**
  - `pnpm tauri build` (release)
  - `pnpm tauri dev` (dev mode, hot reload)
- **Rust backend:**
  - Standard Cargo commands in `src-tauri/` (e.g., `cargo build`, `cargo run`)
- **Debugging:**
  - Rust errors are surfaced in the frontend by setting `clearScreen: false` in `vite.config.ts`.
  - Vite dev server uses port 3000 (strict), HMR on 3001 if `TAURI_DEV_HOST` is set.

## Patterns & Conventions

- **Frontend:**
  - Vue SFCs in `src/`, assets in `src/assets/`.
  - Use TypeScript for all new code.
- **Backend:**
  - Rust code in `src-tauri/src/`.
  - Tauri config in `src-tauri/tauri.conf.json`.
- **Cross-platform:**
  - Build targets and minification are platform-aware (see `vite.config.ts`).
- **Ignore watching Rust code:**
  - Vite is configured to ignore `src-tauri` changes for HMR.

## Integration Points

- **Frontend <-> Backend:**
  - Communication via Tauri IPC (see Tauri docs, not directly visible in this repo).
- **External dependencies:**
  - Managed via `pnpm` (frontend) and `cargo` (backend).

## Examples

- See `vite.config.ts` for custom dev server/HMR logic and platform-specific build tweaks.
- See `src-tauri/src/main.rs` for Tauri app entrypoint and backend logic.

---

For more details, see `README.md` and Tauri/Vue documentation. If you are unsure about a workflow or pattern, check for scripts in `package.json` or Rust code in `src-tauri/`.
