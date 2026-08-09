# APREP Server Deployment

## Requirements

- Python 3.11
- PostgreSQL database reachable from the application
- A process manager or hosting command that runs Uvicorn
- Environment variables configured in the hosting platform

## Production configuration

Set `APP_ENV=production` in the deployment environment. In this mode, APREP reads configuration from process environment variables; it does not load `server/.env`.

```env
APP_ENV=production
DEBUG=false
LOG_LEVEL=INFO

DATABASE_URL=postgresql+psycopg2://aprep_user:URL_ENCODED_PASSWORD@POSTGRES_HOST:5432/aprep_db?sslmode=require

ENCRYPTION_KEY=YOUR_FERNET_KEY
JWT_SECRET_KEY=YOUR_LONG_RANDOM_SECRET
JWT_ALGORITHM=HS256
JWT_EXPIRATION_DAYS=7
JWT_ISSUER=aprep-api
JWT_AUDIENCE=aprep-client

CORS_ORIGINS=https://app.example.com
ALLOWED_HOSTS=api.example.com

# The public demo can call only these approved agent hosts.
AGENT_ENDPOINT_ALLOWED_HOSTS=demo-agent.example.com
ENABLE_DIAGNOSTIC_ROUTES=false

IP_HASH_SALT=ANOTHER_LONG_RANDOM_SECRET
RATE_LIMIT_REQUESTS_PER_MINUTE=40
EVALUATIONS_PER_IP_PER_DAY=1
ABUSE_RECORD_RETENTION_DAYS=7

TRUSTED_PROXY_COUNT=0
TRUSTED_PROXY_IPS=

OLLAMA_BASE_URL=
OLLAMA_DEFAULT_MODEL=llama3.1
OLLAMA_API_KEY=YOUR_OLLAMA_CLOUD_KEY

MAX_REQUEST_BODY_BYTES=1048576
MAX_AGENT_RESPONSE_BYTES=524288

KEEP_ALIVE_ENABLED=false
BASE_URL=
```

Generate one Fernet key and two separate random secrets:

```bash
python -c "from cryptography.fernet import Fernet; print(Fernet.generate_key().decode())"
python -c "import secrets; print(secrets.token_urlsafe(32))"
```

Use the first random value for `JWT_SECRET_KEY` and the second for `IP_HASH_SALT`. Never commit these values or a production `.env` file.

## Database

Create an empty PostgreSQL database and an application user with access only to that database. Use the resulting connection URL for `DATABASE_URL`.

APREP creates its current tables on startup. The project does not yet use migration tooling, so apply schema changes deliberately and back up the database before deploying a future version that changes models.

## Start command

Install dependencies from the repository root:

```bash
pip install -r server/requirements.txt
```

Start from the `server` directory. `APP_ENV` must be provided by the hosting platform; the server deliberately refuses to start when it is absent:

```bash
uvicorn app.main:app --host 0.0.0.0 --port 8000
```

Most hosting platforms provide a `PORT` environment variable. Use that platform-provided value in place of `8000` when required.

## CORS and reverse proxies

`CORS_ORIGINS` must list the exact frontend origins, separated by commas. Wildcard CORS is rejected in production.

`ALLOWED_HOSTS` must list the API host name served by the reverse proxy. Terminate HTTPS at that proxy, redirect HTTP to HTTPS, and do not expose PostgreSQL to the public internet.

`AGENT_ENDPOINT_ALLOWED_HOSTS` is a required, exact allow-list for agent endpoints that the public demo may evaluate. This prevents users from turning the API into a request tool for private networks. Use only domains you control, serve them over HTTPS, and do not use wildcards.

The server sets basic API security headers and a 1 MiB request limit. Keep equivalent request-size and rate limits at the reverse proxy/CDN as well; app-level limiting only starts after traffic reaches the server.

The per-IP abuse controls use the direct client address by default. Only configure forwarded-IP handling when the reverse proxy source addresses are known:

```env
TRUSTED_PROXY_COUNT=1
TRUSTED_PROXY_IPS=10.0.0.10
```

Do not set these values merely because a proxy exists. Trusting arbitrary `X-Forwarded-For` headers lets clients spoof their IP and bypass limits.

## Ollama

For Ollama Cloud, leave `OLLAMA_BASE_URL` empty and provide `OLLAMA_API_KEY`. For a private Ollama deployment, set `OLLAMA_BASE_URL` to its internal URL and leave `OLLAMA_API_KEY` empty. Diagnostic Ollama routes are disabled in production, so an unauthenticated visitor cannot spend your model quota.

Ollama is optional. If it is unavailable, APREP starts normally and uses heuristic scoring.

## Verify after deployment

- Open `/health`: the database should report `healthy`.
- Open `/docs`: FastAPI documentation should load.
- Confirm the frontend can call the API from an origin included in `CORS_ORIGINS`.
- Confirm evaluation requests return the expected rate-limit headers.

## Operational notes

- Use a managed PostgreSQL service with backups and TLS where possible.
- Store all production secrets in the hosting provider’s secret manager.
- Keep `KEEP_ALIVE_ENABLED=false` unless the hosting provider specifically needs self-pings.
- Rotate `IP_HASH_SALT` only deliberately: rotation resets the effective IP-fingerprint history used by abuse controls.
- Use a dedicated PostgreSQL application user, never the `postgres` superuser.
