from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy import text
from app.database import init_db
from app.routers import auth, projects, prompts, question_slots, evaluations, ollama
from app.schemas import HealthResponse
from app.services.ollama_client import ollama_client
from app.services.keep_alive import keep_alive_service
from app.config import settings
from datetime import datetime

# Create FastAPI app
app = FastAPI(
    title="APREP - Agent PRompt Evaluation Platform",
    description="Backend API for evaluating AI agents against expected behaviors and traits",
    version="1.0.0"
)

def parse_cors_origins(cors_origins: str) -> list[str]:
    """Parse comma-separated origins, trimming common env formatting mistakes."""
    if cors_origins.strip() == "*":
        return ["*"]
    return [
        origin.strip().rstrip("/")
        for origin in cors_origins.split(",")
        if origin.strip()
    ]


# Configure CORS
cors_origins = parse_cors_origins(settings.cors_origins)
app.add_middleware(
    CORSMiddleware,
    allow_origins=cors_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Initialize database on startup
@app.on_event("startup")
async def startup_event():
    """Initialize database tables on startup."""
    init_db()
    print("✓ Database initialized")
    
    # Check Ollama availability
    ollama_available = await ollama_client.check_availability()
    if ollama_available:
        print("✓ Ollama is available")
    else:
        print("⚠ Ollama is not available - evaluations will use heuristic scoring")
    
    # Start keep-alive service
    keep_alive_service.start()


@app.on_event("shutdown")
async def shutdown_event():
    """Cleanup on shutdown."""
    keep_alive_service.stop()


# Include routers
app.include_router(auth.router)
app.include_router(projects.router)
app.include_router(prompts.router)
app.include_router(question_slots.router)
app.include_router(evaluations.router)
app.include_router(ollama.router)


@app.get("/", tags=["Root"])
async def root():
    """Root endpoint."""
    return {
        "message": "Welcome to APREP - Agent PRompt Evaluation Platform",
        "docs": "/docs",
        "version": "1.0.0"
    }


@app.get("/ping", tags=["Health"])
async def ping():
    """
    Lightweight ping endpoint for keep-alive.
    Returns minimal response with no database queries.
    """
    return {
        "status": "alive",
        "timestamp": datetime.utcnow().isoformat()
    }


@app.get("/health", response_model=HealthResponse, tags=["Health"])
async def health_check():
    """Health check endpoint with full system status."""
    # Check database
    try:
        from app.database import engine
        with engine.connect() as conn:
            conn.execute(text("SELECT 1"))
        db_status = "healthy"
    except Exception as e:
        db_status = f"unhealthy: {str(e)}"
    
    # Check Ollama
    ollama_available = await ollama_client.check_availability()
    ollama_status = "available" if ollama_available else "unavailable"
    
    return HealthResponse(
        status="healthy" if db_status == "healthy" else "degraded",
        database=db_status,
        ollama=ollama_status
    )


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)

# Made with Bob
