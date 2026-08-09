"""Application-lifetime HTTP transport with connection pooling."""

import httpx


class HTTPClientPool:
    """Own one reusable async HTTP client for all external integrations."""

    def __init__(self) -> None:
        self._client: httpx.AsyncClient | None = None

    async def start(self) -> None:
        if self._client is None or self._client.is_closed:
            self._client = httpx.AsyncClient(
                follow_redirects=False,
                limits=httpx.Limits(max_connections=20, max_keepalive_connections=5, keepalive_expiry=20),
                trust_env=False,
            )

    async def get_client(self) -> httpx.AsyncClient:
        await self.start()
        assert self._client is not None
        return self._client

    async def stop(self) -> None:
        if self._client is not None and not self._client.is_closed:
            await self._client.aclose()
        self._client = None


http_client_pool = HTTPClientPool()
