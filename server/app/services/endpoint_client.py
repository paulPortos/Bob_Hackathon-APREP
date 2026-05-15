import httpx
import time
from typing import Dict, Optional, Tuple
from app.config import settings


class EndpointClient:
    """Client for calling target agent endpoints."""
    
    def __init__(self):
        self.timeout = settings.default_timeout_seconds
    
    async def call_http_endpoint(
        self,
        url: str,
        message: str,
        request_field: str = "message",
        response_field: str = "answer",
        token: Optional[str] = None
    ) -> Tuple[Optional[str], int, Optional[str]]:
        """
        Call an HTTP/HTTPS endpoint and return (response, time_ms, error).
        
        Returns:
            Tuple of (agent_answer, response_time_ms, error_message)
        """
        headers = {}
        if token:
            headers["Authorization"] = f"Bearer {token}"
        
        payload = {request_field: message}
        
        start_time = time.time()
        
        try:
            async with httpx.AsyncClient(timeout=self.timeout) as client:
                response = await client.post(url, json=payload, headers=headers)
                
                elapsed_ms = int((time.time() - start_time) * 1000)
                
                if response.status_code != 200:
                    return None, elapsed_ms, f"HTTP {response.status_code}: {response.text}"
                
                data = response.json()
                agent_answer = data.get(response_field)
                
                if agent_answer is None:
                    return None, elapsed_ms, f"Response missing '{response_field}' field"
                
                return agent_answer, elapsed_ms, None
        
        except httpx.TimeoutException:
            elapsed_ms = int((time.time() - start_time) * 1000)
            return None, elapsed_ms, "Request timeout"
        
        except httpx.RequestError as e:
            elapsed_ms = int((time.time() - start_time) * 1000)
            return None, elapsed_ms, f"Request error: {str(e)}"
        
        except Exception as e:
            elapsed_ms = int((time.time() - start_time) * 1000)
            return None, elapsed_ms, f"Unexpected error: {str(e)}"
    
    async def call_websocket_endpoint(
        self,
        url: str,
        message: str,
        token: Optional[str] = None
    ) -> Tuple[Optional[str], int, Optional[str]]:
        """
        Call a WebSocket endpoint (ws:// or wss://).
        
        TODO: Implement WebSocket support for future versions.
        For MVP, return a placeholder error.
        
        Returns:
            Tuple of (agent_answer, response_time_ms, error_message)
        """
        return None, 0, "WebSocket endpoints not yet supported in MVP"


# Global instance
endpoint_client = EndpointClient()

# Made with Bob
