# APREP Setup Guide

## Quick Start for Development

### 1. Create Virtual Environment

```bash
# Create virtual environment
python3 -m venv venv

# Activate it
source venv/bin/activate  # On macOS/Linux
# OR
venv\Scripts\activate  # On Windows
```

### 2. Install Dependencies

```bash
pip install -r server/requirements.txt
```

### 3. Generate Security Keys

The `.env` file has been created with temporary keys. For production or secure development, generate new keys:

```bash
# Generate encryption key
python -c "from cryptography.fernet import Fernet; print('ENCRYPTION_KEY=' + Fernet.generate_key().decode())"

# Generate JWT secret
python -c "import secrets; print('JWT_SECRET_KEY=' + secrets.token_urlsafe(32))"
```

Copy these values to your `.env` file.

### 4. Run the Application

```bash
cd server
uvicorn app.main:app --reload
```

The API will be available at: http://localhost:8000

### 5. Access Documentation

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

If you encounter database errors, delete and recreate:

```bash
rm server/aprep.db
# Restart the server - it will recreate tables automatically
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