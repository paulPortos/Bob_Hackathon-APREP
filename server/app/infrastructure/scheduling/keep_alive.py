"""Optional Render-style keep-alive scheduler."""

import logging

import httpx
from apscheduler.schedulers.asyncio import AsyncIOScheduler
from apscheduler.triggers.interval import IntervalTrigger

from app.core.config import settings

logger = logging.getLogger(__name__)


class KeepAliveService:
    def __init__(self) -> None:
        self.scheduler = AsyncIOScheduler()
        self.is_running = False

    async def ping_self(self) -> None:
        if not settings.base_url:
            return
        try:
            async with httpx.AsyncClient(timeout=10.0) as client:
                response = await client.get(f"{settings.base_url}/ping")
                if response.status_code != 200:
                    logger.warning("Keep-alive ping returned status %s", response.status_code)
        except Exception as error:
            logger.error("Keep-alive ping failed: %s", error)

    def start(self) -> None:
        if not settings.keep_alive_enabled or not settings.base_url or self.is_running:
            return
        self.scheduler.add_job(
            self.ping_self,
            trigger=IntervalTrigger(minutes=settings.keep_alive_interval_minutes),
            id="keep_alive_ping",
            replace_existing=True,
        )
        self.scheduler.start()
        self.is_running = True

    def stop(self) -> None:
        if self.is_running:
            self.scheduler.shutdown()
            self.is_running = False


keep_alive_service = KeepAliveService()
