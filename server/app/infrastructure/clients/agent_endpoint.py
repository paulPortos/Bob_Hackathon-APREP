"""HTTP/WebSocket adapter for the agent endpoint being evaluated."""

import time
from typing import Optional

import httpx

from app.core.config import settings
from app.infrastructure.http_client import http_client_pool


class AgentEndpointClient:
    """Call a target agent endpoint and normalize its result."""

    def __init__(self) -> None:
        self.timeout = settings.default_timeout_seconds

    async def call_http_endpoint(
        self,
        url: str,
        message: str,
        request_field: str = "message",
        response_field: str = "answer",
        token: Optional[str] = None,
    ) -> tuple[Optional[str], int, Optional[str]]:
        headers = {"Authorization": f"Bearer {token}"} if token else {}
        started_at = time.time()

        try:
            client = await http_client_pool.get_client()
            response = await client.post(
                url,
                json={request_field: message},
                headers=headers,
                timeout=self.timeout,
            )
            elapsed_ms = int((time.time() - started_at) * 1000)

            if response.status_code != 200:
                return None, elapsed_ms, f"HTTP {response.status_code}: {response.text}"

            agent_answer = response.json().get(response_field)
            if agent_answer is None:
                return None, elapsed_ms, f"Response missing '{response_field}' field"
            return agent_answer, elapsed_ms, None
        except httpx.TimeoutException:
            return None, int((time.time() - started_at) * 1000), "Request timeout"
        except httpx.RequestError as error:
            return None, int((time.time() - started_at) * 1000), f"Request error: {error}"
        except Exception as error:
            return None, int((time.time() - started_at) * 1000), f"Unexpected error: {error}"

    async def call_websocket_endpoint(
        self, url: str, message: str, token: Optional[str] = None
    ) -> tuple[Optional[str], int, Optional[str]]:
        """Reserve an explicit adapter boundary for future WebSocket support."""
        return None, 0, "WebSocket endpoints are not yet supported in the MVP"


agent_endpoint_client = AgentEndpointClient()
