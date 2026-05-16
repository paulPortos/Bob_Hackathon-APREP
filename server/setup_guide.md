# APREP Setup Guide

## Prerequisites

- Python 3.8+
- PostgreSQL 12+ (recommended) or SQLite for development
- Ollama (optional, for AI-powered scoring)

## Quick Start for Development

### 1. Set Up PostgreSQL Database

**Option A: PostgreSQL (Recommended for Production)**

Install PostgreSQL and create a database:

```bash
# Install PostgreSQL (macOS)
brew install postgresql@14
brew services start postgresql@14

# Or on Ubuntu/Debian
sudo apt-get install postgresql postgresql-contrib

# Create database and user
sudo -u postgres psql
CREATE DATABASE aprep_db;
CREATE USER aprep_user WITH PASSWORD 'your_secure_password';
GRANT ALL PRIVILEGES ON DATABASE aprep_db TO aprep_user;
\q
```

**Option B: SQLite (Development Only)**

For quick testing, you can use SQLite by changing the DATABASE_URL in `.env`:
```
DATABASE_URL=sqlite:///./aprep.db
```

### 2. Create Virtual Environment

```bash
# Create virtual environment
python3 -m venv venv

# Activate it
source venv/bin/activate  # On macOS/Linux
# OR
venv\Scripts\activate  # On Windows
```

### 3. Install Dependencies

```bash
pip install -r server/requirements.txt
```

### 4. Configure Environment Variables

Copy the example environment file and update it:

```bash
cp server/.env.example server/.env
```

Edit `server/.env` and update:
- `DATABASE_URL`: Your PostgreSQL connection string
- `ENCRYPTION_KEY`: Generate using the command below
- `JWT_SECRET_KEY`: Generate using the command below

### 5. Generate Security Keys

The `.env` file has been created with temporary keys. For production or secure development, generate new keys:

```bash
# Generate encryption key
python -c "from cryptography.fernet import Fernet; print('ENCRYPTION_KEY=' + Fernet.generate_key().decode())"

# Generate JWT secret
python -c "import secrets; print('JWT_SECRET_KEY=' + secrets.token_urlsafe(32))"
```

Copy these values to your `.env` file.

### 6. Initialize Database

The database tables will be created automatically when you first run the application. To manually initialize:

```bash
cd server
python -c "from app.database import init_db; init_db()"
```

### 7. Run the Application

```bash
cd server
uvicorn app.main:app --reload
```

The API will be available at: http://localhost:8000

### 8. Access Documentation

- Swagger UI: http://localhost:8000/docs
- ReDoc: http://localhost:8000/redoc

## Testing the API

### 1. Register a User

```bash
curl -X POST http://localhost:8000/auth/register \
  -H "Content-Type: application/json" \
  -d '{"email": "test@example.com", "password": "testpass123"}'
```

### 2. Login

```bash
curl -X POST http://localhost:8000/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email": "test@example.com", "password": "testpass123"}'
```

Save the `access_token` from the response.

### 3. Create a Test Project

```bash
curl -X POST http://localhost:8000/projects \
  -H "Authorization: Bearer YOUR_TOKEN_HERE" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Test Agent",
    "endpoint_url": "http://localhost:5000/chat",
    "requires_token": false
  }'
```

## Troubleshooting

### Virtual Environment Issues

If you see "externally-managed-environment" error, you must use a virtual environment:

```bash
python3 -m venv venv
source venv/bin/activate
pip install -r requirements.txt
```

### Database Issues

**PostgreSQL Connection Issues:**

```bash
# Check if PostgreSQL is running
brew services list  # macOS
sudo systemctl status postgresql  # Linux

# Test connection
psql -U aprep_user -d aprep_db -h localhost
```

**SQLite Issues (if using SQLite):**

```bash
rm server/aprep.db
# Restart the server - it will recreate tables automatically
```

**Migration Issues:**

If you need to reset the database:

```bash
# PostgreSQL
sudo -u postgres psql
DROP DATABASE aprep_db;
CREATE DATABASE aprep_db;
GRANT ALL PRIVILEGES ON DATABASE aprep_db TO aprep_user;
\q

# Then restart the server to recreate tables
```

### Import Errors

Make sure you're in the virtual environment:

```bash
which python  # Should show path to venv/bin/python
```

If not, activate it:

```bash
source venv/bin/activate
```

## Next Steps

1. Follow the README.md for complete API usage guide
2. Set up Ollama for AI-powered features (optional)
3. Start testing your AI agents!