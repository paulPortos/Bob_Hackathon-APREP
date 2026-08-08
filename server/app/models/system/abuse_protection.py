"""Persistence records used to enforce IP-based request and evaluation limits."""

from datetime import datetime

from sqlalchemy import Column, Date, DateTime, Integer, String, UniqueConstraint

from app.core.database import Base


class IPRequestWindow(Base):
    """One request counter for a fingerprinted IP during one UTC minute."""

    __tablename__ = "ip_request_windows"
    __table_args__ = (
        UniqueConstraint("ip_fingerprint", "window_started_at", name="uq_ip_request_window"),
    )

    id = Column(Integer, primary_key=True)
    ip_fingerprint = Column(String(64), index=True, nullable=False)
    window_started_at = Column(DateTime, nullable=False)
    request_count = Column(Integer, nullable=False, default=1)
    created_at = Column(DateTime, nullable=False, default=datetime.utcnow)


class DailyEvaluationLimit(Base):
    """A claimed evaluation allowance for a fingerprinted IP and UTC date."""

    __tablename__ = "daily_evaluation_limits"
    __table_args__ = (
        UniqueConstraint("ip_fingerprint", "evaluation_date", name="uq_daily_ip_evaluation"),
    )

    id = Column(Integer, primary_key=True)
    ip_fingerprint = Column(String(64), index=True, nullable=False)
    evaluation_date = Column(Date, nullable=False)
    evaluation_count = Column(Integer, nullable=False, default=1)
    created_at = Column(DateTime, nullable=False, default=datetime.utcnow)
