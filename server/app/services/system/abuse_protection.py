"""Database-backed IP abuse controls shared by middleware and evaluations."""

import hashlib
import hmac
from dataclasses import dataclass
from datetime import date, datetime, timedelta

from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session

from app.core.config import settings
from app.core.database import SessionLocal
from app.core.exceptions import RateLimitExceeded
from app.models.system.abuse_protection import DailyEvaluationLimit, IPRequestWindow


@dataclass(frozen=True)
class RequestLimitResult:
    allowed: bool
    remaining: int
    reset_at: datetime


class AbuseProtectionService:
    """Apply request-window and daily-evaluation limits using persisted counters."""

    def __init__(self) -> None:
        self._last_request_cleanup: datetime | None = None

    def client_fingerprint(self, ip_address: str) -> str:
        """Create a stable, non-reversible identifier without storing the raw IP."""
        secret = (settings.ip_hash_salt or settings.jwt_secret_key).encode("utf-8")
        return hmac.new(secret, ip_address.encode("utf-8"), hashlib.sha256).hexdigest()

    def consume_request(self, ip_address: str) -> RequestLimitResult:
        """Consume one request from an IP's current UTC-minute allowance."""
        now = datetime.utcnow()
        window_started_at = now.replace(second=0, microsecond=0)
        reset_at = window_started_at + timedelta(minutes=1)
        fingerprint = self.client_fingerprint(ip_address)
        db = SessionLocal()
        try:
            self._cleanup_request_windows(db, now)
            window = (
                db.query(IPRequestWindow)
                .filter(
                    IPRequestWindow.ip_fingerprint == fingerprint,
                    IPRequestWindow.window_started_at == window_started_at,
                )
                .with_for_update()
                .first()
            )
            if window and window.request_count >= settings.rate_limit_requests_per_minute:
                return RequestLimitResult(False, 0, reset_at)

            if window:
                window.request_count += 1
            else:
                window = IPRequestWindow(
                    ip_fingerprint=fingerprint,
                    window_started_at=window_started_at,
                    request_count=1,
                )
                db.add(window)

            try:
                db.commit()
            except IntegrityError:
                # Two first requests may race to create the same minute record.
                db.rollback()
                return self._retry_request_increment(db, fingerprint, window_started_at, reset_at)

            remaining = max(0, settings.rate_limit_requests_per_minute - window.request_count)
            return RequestLimitResult(True, remaining, reset_at)
        finally:
            db.close()

    def claim_daily_evaluation(self, db: Session, ip_address: str) -> None:
        """Reserve today's evaluation allowance before the target endpoint is called."""
        today = datetime.utcnow().date()
        fingerprint = self.client_fingerprint(ip_address)
        self._cleanup_daily_evaluations(db, today)
        existing = (
            db.query(DailyEvaluationLimit)
            .filter(
                DailyEvaluationLimit.ip_fingerprint == fingerprint,
                DailyEvaluationLimit.evaluation_date == today,
            )
            .first()
        )
        if existing:
            if existing.evaluation_count >= settings.evaluations_per_ip_per_day:
                raise self._daily_limit_error(today)
            existing.evaluation_count += 1
            return

        db.add(
            DailyEvaluationLimit(
                ip_fingerprint=fingerprint,
                evaluation_date=today,
                evaluation_count=1,
            )
        )
        try:
            db.flush()
        except IntegrityError as error:
            db.rollback()
            raise self._daily_limit_error(today) from error

    def _retry_request_increment(
        self,
        db: Session,
        fingerprint: str,
        window_started_at: datetime,
        reset_at: datetime,
    ) -> RequestLimitResult:
        window = (
            db.query(IPRequestWindow)
            .filter(
                IPRequestWindow.ip_fingerprint == fingerprint,
                IPRequestWindow.window_started_at == window_started_at,
            )
            .with_for_update()
            .first()
        )
        if not window or window.request_count >= settings.rate_limit_requests_per_minute:
            return RequestLimitResult(False, 0, reset_at)
        window.request_count += 1
        db.commit()
        return RequestLimitResult(
            True,
            max(0, settings.rate_limit_requests_per_minute - window.request_count),
            reset_at,
        )

    def _cleanup_request_windows(self, db: Session, now: datetime) -> None:
        if self._last_request_cleanup and now - self._last_request_cleanup < timedelta(minutes=1):
            return
        db.query(IPRequestWindow).filter(
            IPRequestWindow.window_started_at < now - timedelta(minutes=2)
        ).delete(synchronize_session=False)
        self._last_request_cleanup = now

    def _cleanup_daily_evaluations(self, db: Session, today: date) -> None:
        db.query(DailyEvaluationLimit).filter(
            DailyEvaluationLimit.evaluation_date
            < today - timedelta(days=settings.abuse_record_retention_days)
        ).delete(synchronize_session=False)

    def _daily_limit_error(self, today: date) -> RateLimitExceeded:
        next_day = datetime.combine(today + timedelta(days=1), datetime.min.time())
        retry_after_seconds = int((next_day - datetime.utcnow()).total_seconds())
        return RateLimitExceeded(
            "This IP address has already used its evaluation allowance for today.",
            retry_after_seconds,
        )


abuse_protection_service = AbuseProtectionService()
