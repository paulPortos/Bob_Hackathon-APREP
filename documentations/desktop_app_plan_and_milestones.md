# APREP Desktop – Tauri/Rust Plan & Milestones

## Target Architecture
- **Frontend** – React + TypeScript built with Vite, loaded in a Tauri WebView.
- **Backend (Rust core)** – Tauri commands written in Rust:
  - SQLite (`rusqlite`) for local project/evaluation data.
  - Windows Credential Manager (`keyring` crate) for API keys and session tokens.
  - Local AI inference with **candle** / **tch‑rs** (GGUF/ONNX models) or remote calls via **reqwest** to OpenAI/Anthropic.
- **Packaging** – `cargo tauri build` → a single signed `.exe` (or installer) for Windows.

## Quick‑Start Setup (macOS host)
1. **Install Rust toolchain** (adds `cargo` and `rustc`):
   ```bash
   brew install rust   # installs rustup, cargo, rustc
   ```
   Ensure the binary directory is on `$PATH` (Homebrew adds `/opt/homebrew/opt/rust/bin`).
2. **Create Tauri project** (run from the repository root):
   ```bash
   npm create tauri-app@latest desktop-tauri \
       -- --ci --frontend react --template react-ts
   ```
   This produces:
   - `desktop-tauri/src-tauri` – Rust crate with Tauri commands.
   - `desktop-tauri/src` – React/Vite UI (you can copy your existing `client/components` here).
3. **Install npm dependencies**:
   ```bash
   cd desktop-tauri
   npm install
   ```
4. **Add required Rust crates** (run in `desktop-tauri/src-tauri`):
   ```bash
   cargo add rusqlite keyring reqwest candle tokenizers
   ```
5. **Run the app in development**:
   ```bash
   npm run tauri dev
   ```
   A native window appears with the React UI.
6. **Build a Windows executable** (you need a Windows host or CI runner with the Windows target):
   ```bash
   cargo tauri build   # produces .exe/.msi in target/release/bundle
   ```
   Sign the binary with a code‑signing certificate before distribution.

## Milestones
| Phase | Goal | Deliverable | Approx. Time |
|-------|------|-------------|-------------|
| **0 – Prereqs** | Rust + Node installed, PATH configured | `cargo --version`, `npm --version` | 1 day |
| **1 – Scaffold** | Tauri + React project generated | `desktop-tauri/` folder | 1 day |
| **2 – Core API** | Implement Rust commands for SQLite, Credential Manager, and AI runner | `src-tauri/src/lib.rs` with `run_local_llm`, `run_remote_llm`, `store_secret` | 3 days |
| **3 – UI Integration** | Wire React UI to Tauri commands (project list, evaluation flow) | UI uses `@tauri-apps/api/tauri` `invoke()` | 5 days |
| **4 – Local AI** | Load a GGUF model with `candle` and run inference | `run_local_llm` returns structured JSON | 4 days |
| **5 – Remote Providers** | Call OpenAI / Anthropic with stored keys | `run_remote_llm` handles errors, retries, JSON validation | 3 days |
| **6 – Packaging** | Generate signed Windows installer (`.exe`/`.msi`) | `cargo tauri build` + code‑signing script | 2 days |
| **7 – End‑to‑End Tests** | Automated tests covering DB migrations, AI calls (mocked), installer upgrade | CI pipeline on GitHub Actions (macOS + Windows) | 4 days |
| **8 – Release** | Publish installer, checksum, release notes; update demo website download button | Signed installer on storage, manifest JSON | 1 day |

## Next Steps
- Copy existing React components (`client/components/*`) into `desktop-tauri/src` and adjust imports.
- Write the first Tauri command (`run_local_llm`) and a simple UI button that calls it.
- Set up Windows CI (GitHub Actions) to produce the final `.exe` and run the signing step.

---
*All milestones are provisional; adjust based on team velocity and feedback.*
