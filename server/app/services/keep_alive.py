"""
Keep-Alive Service for Render Deployment

This service prevents the Render free tier from spinning down due to inactivity
by periodically pinging the application's own endpoint.
"""

import httpx
import logging
from apscheduler.schedulers.asyncio import AsyncIOScheduler
from apscheduler.triggers.interval import IntervalTrigger
from app.config import settings

logger = logging.getLogger(__name__)


class KeepAliveService:
    """Service to keep the application alive on Render free tier."""
    
    def __init__(self):
        self.scheduler = AsyncIOScheduler()
        self.is_running = False
        
    async def ping_self(self):
        """Ping the application's own /ping endpoint."""
        if not settings.base_url:
            logger.warning("BASE_URL not configured, skipping keep-alive ping")
            return
            
        try:
            async with httpx.AsyncClient(timeout=10.0) as client:
                response = await client.get(f"{settings.base_url}/ping")
                if response.status_code == 200:
                    logger.info(f"✓ Keep-alive ping successful: {response.json()}")
                else:
                    logger.warning(f"Keep-alive ping returned status {response.status_code}")
        except Exception as e:
            logger.error(f"Keep-alive ping failed: {str(e)}")
    
    def start(self):
        """Start the keep-alive scheduler."""
        if not settings.keep_alive_enabled:
            logger.info("Keep-alive is disabled")
            return
            
        if not settings.base_url:
            logger.warning("BASE_URL not configured, keep-alive will not start")
            return
            
        if self.is_running:
            logger.warning("Keep-alive scheduler is already running")
            return
        
        # Schedule the ping job
        self.scheduler.add_job(
            self.ping_self,
            trigger=IntervalTrigger(minutes=settings.keep_alive_interval_minutes),
            id='keep_alive_ping',
            name='Keep-Alive Ping',
            replace_existing=True
        )
        
        self.scheduler.start()
        self.is_running = True
        
        logger.info(
            f"✓ Keep-alive scheduler started - pinging {settings.base_url}/ping "
            f"every {settings.keep_alive_interval_minutes} minutes"
        )
    
    def stop(self):
        """Stop the keep-alive scheduler."""
        if self.is_running:
            self.scheduler.shutdown()
            self.is_running = False
            logger.info("Keep-alive scheduler stopped")


# Global keep-alive service instance
keep_alive_service = KeepAliveService()


# Made with Bob