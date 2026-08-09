# APREP - Agent PRompt Evaluation Platform

APREP is a web platform for evaluating AI agent endpoints against expected answers, prompt behavior, safety-oriented traits, and response speed.

The project contains a FastAPI backend and a Next.js frontend. Users register projects for target agent endpoints, store the agent prompt as evaluator context, create or generate reusable question slots, run evaluations, and export the results as JSON or CSV.

## Current Scope

APREP is an MVP. It is useful for structured agent testing, demos, and internal experimentation, but it is not yet a full production evaluation system.

Implemented capabilities:

- Email/password authentication with JWT bearer tokens
- Project management for HTTP/HTTPS target agent endpoints
- Optional bearer token storage for target endpoints, encrypted at rest
- Prompt storage for evaluator context
- Manual question slots with up to 10 questions
- AI-generated question slots through Ollama Cloud or local Ollama
- Evaluation runs with normal questions plus optional trait tests
- Scoring for accuracy, security, honesty, speed, prompt adherence, and semantic accuracy
- Evaluation history, detailed result views, charting, and JSON/CSV export
- Next.js dashboard for the main user workflow

Important constraints:

- WebSocket URLs are accepted by validation, but WebSocket evaluation is not implemented yet.
- The stored prompt is used by APREP's evaluator for scoring context. It is not injected into the target agent endpoint request.
- Database tables are created automatically with SQLAlchemy metadata on startup. The project does not currently include Alembic migrations.
- Heuristic scoring is used when Ollama is unavailable or cannot complete an evaluation.
- Evaluator hallucination is reduced through constrained prompts, numeric parsing, and score clamping, but it is not fully prevented.
- Evaluator responses are parsed from model-generated text; APREP does not yet require strict JSON output or schema-validated evaluator responses.
- APREP does not yet run multi-pass evaluation, evaluator consensus, or self-consistency checks.
- Honesty, security, and semantic accuracy scores depend on evaluator-model judgment rather than deterministic proof.
- Semantic accuracy is not embedding-based yet; APREP does not currently use cosine similarity or vector comparison.
- `score_explanation` is stored for inspection, but it is not independently verified.

## Tech Stack

Backend:

- FastAPI
- SQLAlchemy
- Pydantic / pydantic-settings
- PostgreSQL by default
- SQLite for local development/testing
- httpx
- python-jose JWT
- passlib / bcrypt
- cryptography Fernet token encryption
- APScheduler keep-alive support for Render-style deployments

Frontend:

- Next.js App Router
- TypeScript
- Tailwind CSS
- TanStack React Query
- Zustand
- React Hook Form + Zod
- Recharts
- Lucide React
- React Hot Toast

## Architecture

```text
APREP/
|-- README.md
|-- server/
|   |-- app/
|   |   |-- main.py                 # App composition, CORS, lifecycle only
|   |   |-- api/
|   |   |   `-- routes/{identity,projects,evaluations,integrations,system}/
|   |   |-- controllers/{identity,projects,evaluations,integrations,system}/
|   |   |-- services/{identity,projects,evaluations,integrations}/
|   |   |-- models/{identity,projects,evaluations}/
|   |   |-- schemas/{identity,projects,evaluations,integrations,system}/
|   |   |-- infrastructure/{clients,scheduling}/
|   |   `-- core/{config,database,security,exceptions}/
|   |-- requirements.txt
|   `-- .env.example
`-- client/
    |-- app/                        # Next.js routes
    |-- components/                 # UI and project workflow components
    |-- lib/                        # API client, constants, utilities
    |-- store/                      # Zustand auth store
    |-- types/                      # TypeScript API/domain types
    |-- package.json
    |-- .env.example
    |-- QUICK_START.md
    `-- VERCEL_DEPLOYMENT.md
```

### Server request flow

```text
HTTP request
  -> api/routes             validates transport and declares the endpoint
  -> controllers            coordinates the feature request
  -> services               performs business rules and database work
  -> models / infrastructure persists data or calls external systems
  -> api exception handler  converts known application errors to HTTP responses
```

Every layer is grouped by the same business area: `identity`, `projects`, `evaluations`, `integrations`, or `system`. This keeps a feature's API, controller, service, DTO, and model easy to locate without making one large flat folder.

This is intentionally not a repository-heavy design. For this codebase, SQLAlchemy queries remain in feature services so a developer can follow a use case in one place. Add a repository layer only if the same queries become shared across several services or if persistence needs to be swapped.

### Ownership and change guide

| Need to change | Start here |
| --- | --- |
| Add or change a URL, HTTP status, response header, or dependency | `app/api/routes/` |
| Coordinate request inputs or response presentation | `app/controllers/` |
| Add project, prompt, question-slot, or evaluation rules | `app/services/` |
| Change a table or ORM relationship | `app/models/` |
| Change request validation or response shape | `app/schemas/` |
| Change Ollama, target-agent HTTP, or scheduling behavior | `app/infrastructure/` |
| Change settings, database setup, token handling, or common errors | `app/core/` |

## Data Model

APREP stores the evaluation workflow in relational tables:

- `users`: registered accounts
- `projects`: target agent endpoint configuration, request/response field names, and optional encrypted endpoint token
- `prompts`: one stored prompt record per project, created or updated through `POST /projects/{project_id}/prompt`
- `question_slots`: reusable groups of evaluation questions
- `questions`: individual questions in a slot, optionally with expected answers
- `evaluations`: evaluation run metadata, status, overall score, summary, and recommendation
- `evaluation_results`: per-question agent answer, timing, trait scores, explanation, and trait-test metadata
- `ip_request_windows`: short-lived request counters keyed by a salted IP fingerprint and UTC minute
- `daily_evaluation_limits`: daily evaluation allowances keyed by a salted IP fingerprint and UTC date

APREP uses PostgreSQL in every environment:

```env
DATABASE_URL=postgresql+psycopg2://aprep_user:change-me@localhost:5432/aprep_db
```

When the backend starts, `app.core.database.init_db()` calls `Base.metadata.create_all(bind=engine)`. This creates missing tables but does not handle schema migrations for existing databases.

## Prerequisites

- Python 3.9+
- Node.js 18+
- npm
- PostgreSQL 12+ for the default backend setup
- Ollama Cloud API key or local Ollama server for AI-powered generation/scoring

Ollama is optional. APREP still runs without it, but generated questions and AI-based scoring will not be available.

## Backend Setup

From the repository root:

```bash
python -m venv venv
source venv/bin/activate
pip install -r server/requirements.txt
cp server/.env.example server/.env
```

Generate required secrets:

```bash
python -c "from cryptography.fernet import Fernet; print(Fernet.generate_key().decode())"
python -c "import secrets; print(secrets.token_urlsafe(32))"
```

Update `server/.env`:

```env
DATABASE_URL=postgresql://aprep_user:your_password@localhost:5432/aprep_db
ENCRYPTION_KEY=your-generated-fernet-key
JWT_SECRET_KEY=your-generated-jwt-secret
JWT_ALGORITHM=HS256
JWT_EXPIRATION_DAYS=7
APP_ENV=development
DEBUG=true
LOG_LEVEL=DEBUG

OLLAMA_BASE_URL=
OLLAMA_DEFAULT_MODEL=llama3.1
OLLAMA_API_KEY=your-ollama-api-key

CORS_ORIGINS=*
```

For local Ollama instead of Ollama Cloud:

```env
OLLAMA_BASE_URL=http://localhost:11434
OLLAMA_API_KEY=
OLLAMA_DEFAULT_MODEL=llama3.1
```

For production, configure all settings and secrets in the deployment platform, set `APP_ENV=production`, and use explicit allowed origins. Production intentionally does not load the local `.env` file.

Start the backend:

```bash
cd server
uvicorn app.main:app --reload
```

Backend URLs:

- API root: `http://localhost:8000`
- Swagger UI: `http://localhost:8000/docs`
- ReDoc: `http://localhost:8000/redoc`
- Health check: `http://localhost:8000/health`
- Keep-alive ping: `http://localhost:8000/ping`

## Frontend Setup

In another terminal:

```bash
cd client
npm install
cp .env.example .env.local
npm run dev
```

The client runs at `http://localhost:3000` and uses this API URL by default:

```env
NEXT_PUBLIC_API_URL=http://localhost:8000
```

## Target Agent Endpoint Contract

For HTTP/HTTPS projects, APREP sends a POST request to the registered endpoint.

Default request payload:

```json
{
  "message": "Question text from APREP"
}
```

Default expected response payload:

```json
{
  "answer": "Target agent response"
}
```

Both field names are configurable per project:

- `request_field_name`, default `message`
- `response_field_name`, default `answer`

If a project token is configured, APREP sends it as:

```http
Authorization: Bearer <token>
```

## API Workflow

The web UI covers the normal workflow. The same workflow can also be performed through the API.

Register:

```bash
curl -X POST http://localhost:8000/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "user@example.com",
    "password": "securepass123"
  }'
```

Login:

```bash
curl -X POST http://localhost:8000/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "user@example.com",
    "password": "securepass123"
  }'
```

Create a project:

```bash
curl -X POST http://localhost:8000/projects \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Support Agent",
    "endpoint_url": "http://localhost:5000/chat",
    "requires_token": false,
    "request_field_name": "message",
    "response_field_name": "answer"
  }'
```

Save the agent prompt:

```bash
curl -X POST http://localhost:8000/projects/PROJECT_ID/prompt \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "content": "You are a support agent. Be accurate, concise, and honest about uncertainty.",
    "file_type": "txt"
  }'
```

Create a manual question slot:

```bash
curl -X POST http://localhost:8000/projects/PROJECT_ID/question-slots \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Baseline Support Questions",
    "description": "Basic behavior and correctness checks",
    "questions": [
      {
        "question_text": "What should I do if I forgot my password?",
        "expected_answer": "Use the password reset flow.",
        "order": 1
      }
    ]
  }'
```

Generate questions with Ollama:

```bash
curl -X POST http://localhost:8000/projects/PROJECT_ID/generate-questions \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "count": 5,
    "purpose": "Evaluate support-agent responses for account recovery questions.",
    "use_prompt": true
  }'
```

Run an evaluation:

```bash
curl -X POST http://localhost:8000/projects/PROJECT_ID/evaluate \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "slot_id": "SLOT_ID",
    "prompt_id": "PROMPT_ID",
    "include_trait_tests": true,
    "trait_test_count": 5
  }'
```

Fetch evaluation details:

```bash
curl -X GET http://localhost:8000/evaluations/EVALUATION_ID \
  -H "Authorization: Bearer YOUR_TOKEN"
```

Export results:

```bash
curl -X GET http://localhost:8000/evaluations/EVALUATION_ID/export/json \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -o evaluation_report.json

curl -X GET http://localhost:8000/evaluations/EVALUATION_ID/export/csv \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -o evaluation_report.csv
```

## Evaluation Scoring

Each answer can receive scores from 0 to 100 for:

- Accuracy
- Semantic accuracy
- Prompt adherence
- Security
- Honesty
- Speed

Speed is calculated from response time:

- `< 500ms`: 100
- `500-999ms`: 80
- `1000-1999ms`: 60
- `2000-4999ms`: 40
- `>= 5000ms`: 20

When Ollama is available, APREP asks Ollama to evaluate the target answer against the question, stored prompt, and expected answer. When Ollama is unavailable, APREP falls back to heuristic scoring for security, honesty, and expected-answer overlap.

Optional trait tests currently cover:

- Security
- Honesty
- Prompt adherence

## Abuse Protection

Every non-preflight request is limited to 40 requests per IP per UTC minute. `POST /projects/{project_id}/evaluate` also has one evaluation allowance per IP per UTC day. The daily allowance is claimed after the project, prompt, and question slot are validated but before the target agent endpoint is called; a target endpoint failure therefore still consumes the allowance.

APREP stores a keyed fingerprint of the IP, not the raw address. Set `IP_HASH_SALT` to a dedicated secret in production. By default, APREP uses the direct TCP client address. Forwarded IP headers are used only when both `TRUSTED_PROXY_COUNT` and `TRUSTED_PROXY_IPS` are configured for your reverse proxy.

## Environment Variables

Development loads `server/.env` by default. Production reads settings only from the deployment process environment when `APP_ENV=production`.

| Variable | Purpose |
| --- | --- |
| `APP_ENV` | Selects `development` or `production` configuration. Set it in the deployment environment for production. |
| `DEBUG` | Enables FastAPI debug behavior. `true` in development and `false` in production. |
| `LOG_LEVEL` | Intended application log verbosity. Defaults to `DEBUG` locally and `INFO` in production. |
| `DATABASE_URL` | SQLAlchemy database URL. PostgreSQL is the default; SQLite is supported for local testing. |
| `ENCRYPTION_KEY` | Fernet key used to encrypt stored project endpoint tokens. |
| `JWT_SECRET_KEY` | Secret used to sign API access tokens. |
| `JWT_ALGORITHM` | JWT algorithm. Defaults to `HS256`. |
| `JWT_EXPIRATION_DAYS` | Token lifetime in days. Defaults to `7`. |
| `OLLAMA_BASE_URL` | Empty for Ollama Cloud, or a local/custom Ollama URL such as `http://localhost:11434`. |
| `OLLAMA_DEFAULT_MODEL` | Model used for generation and scoring. Defaults to `llama3.1`. |
| `OLLAMA_API_KEY` | Required for Ollama Cloud. |
| `MAX_QUESTIONS_PER_SLOT` | Config value for maximum questions per slot. Current schema enforces 10. |
| `MAX_TRAIT_TESTS` | Config value for maximum trait tests. Current schema enforces 10. |
| `DEFAULT_TIMEOUT_SECONDS` | Timeout for target endpoint and Ollama requests. |
| `CORS_ORIGINS` | `*` or comma-separated frontend origins. |
| `BASE_URL` | Deployed backend URL used by keep-alive. |
| `KEEP_ALIVE_ENABLED` | Enables scheduled keep-alive pings. |
| `KEEP_ALIVE_INTERVAL_MINUTES` | Keep-alive interval. Defaults to `14`. |
| `RATE_LIMIT_REQUESTS_PER_MINUTE` | Maximum non-preflight requests per IP each UTC minute. Defaults to `40`. |
| `EVALUATIONS_PER_IP_PER_DAY` | Maximum evaluations per IP each UTC day. Defaults to `1`. |
| `TRUSTED_PROXY_COUNT` | Number of trusted proxy hops in `X-Forwarded-For`. Keep `0` unless a proxy is configured. |
| `TRUSTED_PROXY_IPS` | Comma-separated direct proxy addresses allowed to supply forwarded IP headers. |
| `IP_HASH_SALT` | Dedicated secret used to fingerprint IP addresses. Production should set this value. |
| `ABUSE_RECORD_RETENTION_DAYS` | Number of days to retain daily IP-fingerprint records. Defaults to `7`. |

Frontend variables are loaded from `client/.env.local`.

| Variable | Purpose |
| --- | --- |
| `NEXT_PUBLIC_API_URL` | Backend API base URL. Defaults to `http://localhost:8000`. |

## Troubleshooting

Database connection errors:

```bash
# Confirm PostgreSQL is running and the configured database/user exist.
psql -U aprep_user -d aprep_db -h localhost
```

Check Ollama:

```bash
# Local Ollama
curl http://localhost:11434/api/tags

# APREP's Ollama route
curl http://localhost:8000/ollama/models
```

Check backend health:

```bash
curl http://localhost:8000/health
```

Frontend cannot reach backend:

- Confirm the backend is running on `http://localhost:8000`.
- Confirm `client/.env.local` has the correct `NEXT_PUBLIC_API_URL`.
- Confirm `CORS_ORIGINS` allows the frontend origin.

## Deployment Notes

Dedicated deployment notes live in:

- `server/DEPLOYMENT.md` for the FastAPI backend and PostgreSQL
- `client/VERCEL_DEPLOYMENT.md` for the Next.js frontend on Vercel

For production-like deployments:

- Use PostgreSQL, not SQLite.
- Set explicit CORS origins instead of `*`.
- Generate fresh `ENCRYPTION_KEY` and `JWT_SECRET_KEY` values.
- Use HTTPS endpoints for frontend, backend, and target agents.
- Add database migrations before making schema changes against persistent data.

## License

No license has been specified yet.
