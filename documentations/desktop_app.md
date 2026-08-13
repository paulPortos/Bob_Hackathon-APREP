# APREP Desktop App Plan

## Product direction

Build a Windows-first APREP app with the same main workflow as the web app: create a project, save its prompt, prepare question sets, run evaluations, inspect history, and export reports.

The desktop version changes the ownership of the data and evaluator:

- For the desktop app, the remote APREP server stores user accounts and handles authentication only; the existing web app can continue using its current server-side data.
- Projects, prompts, questions, evaluator settings, runs, and results live in a local SQLite database. There is no cloud sync in v1.
- Agent endpoint tokens, AI provider keys, and the APREP session token are stored in Windows Credential Manager, never in SQLite or logs. The user's password is never stored by the app.
- Agent requests and AI evaluation run from the desktop core. This allows `localhost` agent testing without browser CORS restrictions.
- Ollama, OpenAI API, and Anthropic API are the first evaluator providers. “OpenAI” means an API key, not a ChatGPT website login.

If OpenAI or Anthropic is selected, evaluation content leaves the device and is sent directly to that provider. Ollama can remain fully local.

## Proposed architecture

Use **Tauri 2 + React/TypeScript + Vite**. Reuse APREP's visual components, domain types, request template (`{{message}}`), response-path behavior, and report design, but do not carry over Next.js server features that a desktop SPA does not need.

```text
React/Vite UI
    -> typed Tauri commands
Rust desktop core
    -> SQLite (projects and evaluation data)
    -> Windows Credential Manager (tokens and API keys)
    -> localhost/LAN/remote agent endpoints
    -> Ollama, OpenAI, or Anthropic evaluator
    -> remote APREP API (account authentication only)
```

Keep privileged operations in Rust and expose only the commands the UI needs. Use a strict content-security policy and Tauri capability allow-list. Allow HTTP/HTTPS agent endpoints, enforce timeouts and response-size limits, redact secrets, and show the exact request mapping before a test runs.

The local database should use versioned migrations and keep data separated by the authenticated APREP user ID. Main tables will mirror the useful web concepts: projects, prompts, question sets, questions, evaluator profiles (without keys), evaluations, results, and migration metadata.

## Evaluation reliability

Replace the current free-text score parsing and silent heuristic fallback with a versioned evaluation pipeline:

- Keep deterministic checks deterministic: connection success, response format, latency, exact/regex assertions, and simple expected-answer checks.
- Ask the evaluator for schema-constrained JSON with a score, reason, and evidence for every AI-judged criterion. Use native structured output when a provider supports it; otherwise validate strict JSON and retry only a limited number of times.
- Use one pass in **Fast** mode and multiple judge passes with median/consensus scoring in **Reliable** mode. Show the extra time and provider cost before starting.
- Store the provider, model identifier, model settings, rubric version, judge passes, raw per-pass scores, and whether structured output was supported.
- If the evaluator is unavailable or repeatedly returns invalid output, mark the run failed or degraded. Do not silently replace it with neutral scores.
- Maintain a versioned, human-labelled reliability suite covering correct answers, hallucinations, safe refusals, prompt injection, and prompt adherence. A rubric/provider change ships only after passing this suite and the repeat-run variance gate.
- Mark tested provider/model/rubric combinations as **Verified**. Let users select other compatible models, but label those results **Unverified** rather than promising the same reliability.

Retain the current score areas—accuracy, semantic accuracy, prompt adherence, security, honesty, and speed—but allow a criterion to be `not applicable` when there is not enough evidence instead of inventing a score.

## Delivery phases

### 1. Desktop foundation

- Create the Tauri/Vite app and port the APREP shell, authentication screens, and reusable UI components.
- Connect to the existing FastAPI registration, login, and current-user endpoints. Add refresh/revoke support to the server if persistent sessions require it.
- Add SQLite migrations and local repositories.
- Add the Windows secret-vault layer. A secret may pass through the UI once when entered, but saved secrets must never be returned to or persisted by the renderer, SQLite, exports, or logs.

### 2. Local APREP workflow

- Implement local project, prompt, question-set, and question management.
- Implement “Test connection” and evaluation calls from the Rust core, including `localhost`, `127.0.0.1`, and local network endpoints.
- Preserve flexible JSON request templates and nested response paths from the web app.
- Add evaluation progress, cancellation, history, details, and JSON/CSV export.

HTTP/HTTPS is the v1 endpoint contract. WebSocket testing comes later because the current web app validates WebSocket URLs but does not execute them.

### 3. Evaluator providers and scoring v2

- Define one provider interface and implement Ollama first, then OpenAI, then Anthropic.
- Add provider setup, model selection, connection tests, secret storage, and clear local/cloud privacy labels.
- Implement the versioned rubric, validated structured results, Fast/Reliable modes, and reliability test suite.
- Add mocked provider tests so releases do not depend on live API availability or spend.

### 4. Windows release and website download

- Test unit, database migration, endpoint-contract, provider-contract, cancellation, and secret-redaction behavior.
- Run end-to-end tests against a small local mock agent and test install/upgrade/uninstall on a clean Windows machine.
- Build a per-user NSIS `-setup.exe` on Windows CI. Sign the app and installer before public distribution to reduce Windows trust warnings.
- Publish the signed installer, checksum, version, and release notes to release storage. The demo website's download button should point to the latest stable release manifest rather than a hard-coded file.
- Add automatic updates only after signed manual releases and upgrade-safe database migrations are proven.

## v1 completion checklist

- A user can register/login, restart the app, and keep a secure session.
- Two APREP accounts on one PC cannot see each other's local projects.
- A user can evaluate a localhost HTTP agent using Ollama, OpenAI, or Anthropic.
- Results identify exactly how they were produced and never hide evaluator failure.
- Existing APREP project/question/evaluation behavior and JSON/CSV export are available locally.
- A signed `.exe` installs, upgrades without losing local data, and downloads from the demo website.

Later work: WebSocket agents, encrypted backup/import, optional cross-device sync, team features, macOS/Linux builds, and a mature auto-update channel.
