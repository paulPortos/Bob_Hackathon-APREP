# APREP Server Setup

## Local setup

From the repository root:

```bash
python3 -m venv server/venv
source server/venv/bin/activate
pip install -r server/requirements.txt
cp server/.env.example server/.env
cd server
uvicorn app.main:app --reload
```

The API is available at `http://localhost:8000`. Use `http://localhost:8000/docs` to explore and test the API.

## Configuration

Create an empty PostgreSQL database and application user first. Then keep its connection URL in `server/.env`:

```env
APP_ENV=development
DATABASE_URL=postgresql+psycopg2://aprep_user:your-password@localhost:5432/aprep_db
ENCRYPTION_KEY=your-fernet-key
JWT_SECRET_KEY=your-random-secret
CORS_ORIGINS=*
```

Generate the required secrets:

```bash
python -c "from cryptography.fernet import Fernet; print(Fernet.generate_key().decode())"
python -c "import secrets; print(secrets.token_urlsafe(32))"
```

Ollama is optional. Without a reachable Ollama service or API key, APREP uses heuristic scoring. For production, set `APP_ENV=production` and provide all configuration through the deployment environment, including explicit `CORS_ORIGINS` and a dedicated `IP_HASH_SALT`.

## Troubleshooting

**Server fails during startup**

Confirm `server/.env` exists, has valid `ENCRYPTION_KEY` and `JWT_SECRET_KEY` values, and that the virtual environment is active.

**Database connection error**

Verify the PostgreSQL connection string, database, and database user outside APREP first. APREP creates its tables on startup after it can connect.

**`ModuleNotFoundError` or dependency errors**

Activate `server/venv`, then reinstall with `pip install -r server/requirements.txt`.

**Ollama unavailable warning**

This does not stop the server. Check `OLLAMA_BASE_URL` for a local service or `OLLAMA_API_KEY` for Ollama Cloud if AI scoring or question generation is needed.

**HTTP 429 response**

The server allows 40 requests per IP per UTC minute and one evaluation per IP per UTC day by default. Wait for the `Retry-After` interval, or adjust the documented rate-limit settings only if the deployment requirements allow it.
