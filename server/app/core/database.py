"""SQLAlchemy setup and request-scoped database dependency."""

from sqlalchemy import create_engine
from sqlalchemy.orm import DeclarativeBase, sessionmaker
from sqlalchemy.pool import StaticPool

from app.core.config import settings


engine_options: dict = {}
if settings.database_url.startswith("sqlite"):
    # SQLite connections are used from FastAPI's worker thread during local development.
    engine_options["connect_args"] = {"check_same_thread": False}
    if settings.database_url in {"sqlite://", "sqlite:///:memory:"}:
        # A single in-memory connection is useful for isolated test runs.
        engine_options["poolclass"] = StaticPool

engine = create_engine(settings.database_url, **engine_options)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)


class Base(DeclarativeBase):
    """Base class shared by all SQLAlchemy models."""


def get_db():
    """Provide one database session per request and always close it."""
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


def init_db() -> None:
    """Register all models and create any missing tables."""
    import app.models  # noqa: F401 - imports model metadata before create_all

    Base.metadata.create_all(bind=engine)
