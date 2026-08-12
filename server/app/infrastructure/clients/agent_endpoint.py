"""HTTP/WebSocket adapter for the agent endpoint being evaluated."""

import json
import time
from typing import Optional

import httpx

from app.core.agent_payload import AgentPayloadError, build_request_body, extract_response_value
from app.core.config import settings
from app.core.endpoint_security import validate_outbound_agent_endpoint
from app.infrastructure.http_client import http_client_pool


class AgentEndpointClient:
    """Call a target agent endpoint and normalize its result."""

    def __init__(self) -> None:
        self.timeout = settings.default_timeout_seconds

    async def call_http_endpoint(
        self,
        url: str,
        message: str,
        request_body_template: str,
        response_path: str,
        token: Optional[str] = None,
    ) -> tuple[Optional[str], int, Optional[str]]:
        headers = {"Authorization": f"Bearer {token}"} if token else {}
        started_at = time.time()

        try:
            request_body = build_request_body(request_body_template, message)
            await validate_outbound_agent_endpoint(url)
            client = await http_client_pool.get_client()
            async with client.stream(
                "POST",
                url,
                json=request_body,
                headers=headers,
                timeout=self.timeout,
            ) as response:
                elapsed_ms = int((time.time() - started_at) * 1000)
                if not 200 <= response.status_code < 300:
                    return None, elapsed_ms, f"Endpoint returned HTTP {response.status_code}"
                content_length = response.headers.get("content-length")
                if content_length and int(content_length) > settings.max_agent_response_bytes:
                    return None, elapsed_ms, "Endpoint response is too large"
                body = bytearray()
                async for chunk in response.aiter_bytes(chunk_size=64 * 1024):
                    body.extend(chunk)
                    if len(body) > settings.max_agent_response_bytes:
                        return None, elapsed_ms, "Endpoint response is too large"
            payload = json.loads(body)
            agent_answer = extract_response_value(payload, response_path)
            return agent_answer, elapsed_ms, None
        except AgentPayloadError as error:
            return None, int((time.time() - started_at) * 1000), str(error)
        except json.JSONDecodeError:
            return None, int((time.time() - started_at) * 1000), "Endpoint returned invalid JSON"
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
