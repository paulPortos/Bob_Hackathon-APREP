# APREP - Agent PRompt Evaluation Platform

**APREP** stands for:
1. **Agent PREParation** - Prepare your AI agents for production
2. **Agent PRompt Evaluation Platform** - Evaluate agent behavior and performance

A FastAPI-based backend for testing and evaluating AI agents against expected behaviors, security requirements, and performance traits.

## 🎯 What is APREP?

APREP is a hackathon prototype that helps developers test whether their AI agents meet expected requirements. It evaluates:

- **Required Traits**: Security, Honesty, Speed, Prompt Adherence, Semantic Accuracy
- **Custom Questions**: User-defined test scenarios
- **Auto-Generated Tests**: AI-powered question generation using Ollama

## ✨ Features

- 🔐 **User Authentication** - Email/password authentication with JWT tokens
- 🎯 **Project Management** - Register and manage AI agent endpoints
- 📝 **Prompt Management** - Store and version agent prompts
- ❓ **Question Slots** - Create reusable question sets (manual or auto-generated)
- 🤖 **Ollama Integration** - AI-powered question generation and evaluation
- 🔍 **Comprehensive Evaluation** - Test agents across multiple dimensions
- 📊 **Detailed Reports** - JSON and CSV export formats
- 🚀 **Fast & Simple** - Clean MVP focused on core functionality

## 🛠️ Tech Stack

- **FastAPI** - Modern Python web framework
- **SQLAlchemy** - ORM for database operations
- **SQLite** - Lightweight database (easy for prototyping)
- **Pydantic** - Data validation
- **httpx** - Async HTTP client
- **Ollama** - Local LLM integration
- **JWT** - Secure authentication
- **bcrypt** - Password hashing

## 📋 Prerequisites

- Python 3.9 or higher
- pip (Python package manager)
- Ollama (optional, for AI-powered features)

## 🚀 Installation

### 1. Clone the repository

```bash
git clone <repository-url>
cd Bob_Hackathon-APREP
```

### 2. Create virtual environment

```bash
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
```

### 3. Install dependencies

```bash
pip install -r server/requirements.txt
```

### 4. Set up environment variables

```bash
cp server/.env.example server/.env
```

Edit `.env` and configure:

```env
# Generate encryption key with: python -c "from cryptography.fernet import Fernet; print(Fernet.generate_key().decode())"
ENCRYPTION_KEY=your-generated-encryption-key

# Generate JWT secret with: python -c "import secrets; print(secrets.token_urlsafe(32))"
JWT_SECRET_KEY=your-generated-jwt-secret

# Other settings (defaults are fine for local development)
DATABASE_URL=sqlite:///./aprep.db
OLLAMA_BASE_URL=http://localhost:11434
OLLAMA_DEFAULT_MODEL=llama2
```

### 5. Generate required keys

```bash
# Generate encryption key
python -c "from cryptography.fernet import Fernet; print(Fernet.generate_key().decode())"

# Generate JWT secret
python -c "import secrets; print(secrets.token_urlsafe(32))"
```

Copy these values to your `.env` file.

## 🎮 Running the Application

### Start the server

```bash
cd server
uvicorn app.main:app --reload
```

The API will be available at: `http://localhost:8000`

### Access API Documentation

- **Swagger UI**: http://localhost:8000/docs
- **ReDoc**: http://localhost:8000/redoc

## 🦙 Ollama Setup (Optional but Recommended)

Ollama provides AI-powered question generation and evaluation scoring.

### Install Ollama

Visit [ollama.ai](https://ollama.ai) and follow installation instructions for your OS.

### Pull a model

```bash
ollama pull llama2
```

### Verify Ollama is running

```bash
curl http://localhost:11434/api/tags
```

If Ollama is not available, APREP will fall back to heuristic scoring.

## 📖 API Usage Guide

### 1. Register a User

```bash
curl -X POST http://localhost:8000/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "user@example.com",
    "password": "securepass123"
  }'
```

### 2. Login

```bash
curl -X POST http://localhost:8000/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "user@example.com",
    "password": "securepass123"
  }'
```

Response:
```json
{
  "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "token_type": "bearer"
}
```

**Save this token!** Use it in all subsequent requests.

### 3. Create a Project

```bash
curl -X POST http://localhost:8000/projects \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "My AI Agent",
    "endpoint_url": "http://localhost:5000/chat",
    "requires_token": false,
    "request_field_name": "message",
    "response_field_name": "answer"
  }'
```

### 4. Upload a Prompt

```bash
curl -X POST http://localhost:8000/projects/PROJECT_ID/prompt \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "content": "You are a helpful AI assistant. Always be polite and accurate.",
    "file_type": "txt"
  }'
```

### 5. Create a Question Slot (Manual)

```bash
curl -X POST http://localhost:8000/projects/PROJECT_ID/question-slots \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Basic Tests",
    "description": "Basic functionality tests",
    "questions": [
      {
        "question_text": "What is 2+2?",
        "expected_answer": "4",
        "order": 1
      },
      {
        "question_text": "Explain what AI is.",
        "expected_answer": null,
        "order": 2
      }
    ]
  }'
```

### 6. Generate Questions (Auto with Ollama)

```bash
curl -X POST http://localhost:8000/projects/PROJECT_ID/generate-questions \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "count": 5,
    "purpose": "Test the agent's ability to answer programming questions",
    "use_prompt": true
  }'
```

### 7. Run an Evaluation

```bash
curl -X POST http://localhost:8000/projects/PROJECT_ID/evaluate \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "slot_id": "SLOT_ID",
    "include_trait_tests": true,
    "trait_test_count": 5
  }'
```

### 8. Get Evaluation Results

```bash
curl -X GET http://localhost:8000/evaluations/EVALUATION_ID \
  -H "Authorization: Bearer YOUR_TOKEN"
```

### 9. Export Evaluation Report

**JSON:**
```bash
curl -X GET http://localhost:8000/evaluations/EVALUATION_ID/export/json \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -o evaluation_report.json
```

**CSV:**
```bash
curl -X GET http://localhost:8000/evaluations/EVALUATION_ID/export/csv \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -o evaluation_report.csv
```

## 🔍 Evaluation Scoring

### Required Traits

APREP evaluates agents on these traits:

1. **Accuracy** (0-100): How correct and factual are the answers?
2. **Security** (0-100): Does the agent refuse unsafe requests?
3. **Honesty** (0-100): Does it admit uncertainty vs. hallucinating?
4. **Speed** (0-100): Response time performance
5. **Prompt Adherence** (0-100): Does it follow its instructions?
6. **Semantic Accuracy** (0-100): Does it match intended meaning?

### Scoring Methods

- **Primary**: Ollama-based AI evaluation (when available)
- **Fallback**: Heuristic scoring based on keywords and patterns

### Trait Tests

APREP automatically generates trait-specific test questions:

- **Security Tests**: Attempts to trigger unsafe behavior
- **Honesty Tests**: Questions outside the agent's knowledge
- **Prompt Adherence Tests**: Instructions that conflict with the agent's role

## 📁 Project Structure

```
Bob_Hackathon-APREP/
├── server/                  # Backend (FastAPI)
│   ├── app/
│   │   ├── main.py              # FastAPI application
│   │   ├── config.py            # Configuration management
│   │   ├── database.py          # Database setup
│   │   ├── models.py            # SQLAlchemy models
│   │   ├── schemas.py           # Pydantic schemas
│   │   ├── routers/             # API endpoints
│   │   │   ├── auth.py          # Authentication
│   │   │   ├── projects.py      # Project management
│   │   │   ├── prompts.py       # Prompt management
│   │   │   ├── question_slots.py # Question slots
│   │   │   ├── evaluations.py   # Evaluations
│   │   │   └── ollama.py        # Ollama integration
│   │   ├── services/            # Business logic
│   │   │   ├── endpoint_client.py    # HTTP client
│   │   │   ├── ollama_client.py      # Ollama client
│   │   │   ├── evaluator.py          # Evaluation engine
│   │   │   ├── scoring.py            # Scoring logic
│   │   │   └── report_generator.py   # Report export
│   │   └── utils/               # Utilities
│   │       ├── auth.py          # JWT utilities
│   │       └── security.py      # Token encryption
│   ├── requirements.txt
│   ├── .env.example
│   ├── .gitignore
│   ├── setup_guide.md
│   └── IMPLEMENTATION_SUMMARY.md
├── client/                  # Frontend (Streamlit - Coming Soon)
└── README.md
```

## 🎯 Example Workflow

1. **Register** and **login** to get an access token
2. **Create a project** with your agent's endpoint URL
3. **Upload a prompt** that describes your agent's behavior
4. **Create question slots** (manual or auto-generated)
5. **Run evaluations** to test your agent
6. **Review results** and export reports
7. **Iterate** on your agent based on feedback

## ⚠️ Limitations (Hackathon Prototype)

- **No email verification** - Simple email/password auth only
- **SQLite database** - Not suitable for production scale
- **No rate limiting** - Should be added for production
- **WebSocket support** - Placeholder only (HTTP/HTTPS work)
- **Basic security** - Token encryption is simple, not enterprise-grade
- **No user management** - No admin features or team collaboration
- **Heuristic scoring** - Fallback scoring is basic keyword matching

## 🔮 Future Enhancements

- WebSocket endpoint support
- More sophisticated scoring algorithms
- Team collaboration features
- Advanced analytics and trends
- Custom trait definitions
- Batch evaluations
- Scheduled evaluations
- Email notifications
- PostgreSQL support
- Docker deployment
- CI/CD integration

## 🐛 Troubleshooting

### Database errors

```bash
# Delete and recreate database
rm server/aprep.db
# Restart the server - it will recreate tables
```

### Ollama connection issues

```bash
# Check if Ollama is running
curl http://localhost:11434/api/tags

# Start Ollama if needed
ollama serve
```

### Import errors

```bash
# Reinstall dependencies
pip install -r server/requirements.txt --force-reinstall
```

### Authentication errors

```bash
# Verify your token is valid
curl -X GET http://localhost:8000/auth/me \
  -H "Authorization: Bearer YOUR_TOKEN"
```

## 📝 License

This is a hackathon prototype. Use at your own risk.

## 🤝 Contributing

This is a hackathon project, but suggestions and improvements are welcome!

## 📧 Support

For issues or questions, please open an issue in the repository.

---

**Built with ❤️ for the hackathon**