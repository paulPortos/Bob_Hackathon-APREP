"""Validation for user-configured agent endpoints.

Production deployments only call explicitly approved HTTPS hosts. This is a
small, reliable boundary that prevents user input from becoming an internal
network request.
"""

import asyncio
import ipaddress
import socket
from urllib.parse import urlsplit

from app.core.config import settings


class UnsafeAgentEndpoint(ValueError):
    """Raised when an endpoint is not safe for the server to call."""


def _normalise_host(host: str) -> str:
    try:
        return host.encode("idna").decode("ascii").rstrip(".").lower()
    except UnicodeError as error:
        raise UnsafeAgentEndpoint("Endpoint host is invalid") from error


def _allowed_hosts() -> set[str]:
    return {
        _normalise_host(host.strip())
        for host in settings.agent_endpoint_allowed_hosts.split(",")
        if host.strip()
    }


def _parse_endpoint(value: str):
    try:
        parsed = urlsplit(value)
        port = parsed.port
    except ValueError as error:
        raise UnsafeAgentEndpoint("Endpoint URL is invalid") from error

    if parsed.scheme not in {"http", "https"} or not parsed.hostname:
        raise UnsafeAgentEndpoint("Endpoint URL must use HTTP or HTTPS and include a host")
    if parsed.username or parsed.password:
        raise UnsafeAgentEndpoint("Endpoint URL must not include credentials")
    if port is not None and not 1 <= port <= 65535:
        raise UnsafeAgentEndpoint("Endpoint port is invalid")
    return parsed, _normalise_host(parsed.hostname)


def validate_agent_endpoint_url(value: str) -> str:
    """Validate an endpoint at project creation/update time."""
    parsed, host = _parse_endpoint(value)
    if settings.app_env == "production":
        if parsed.scheme != "https":
            raise UnsafeAgentEndpoint("Production agent endpoints must use HTTPS")
        if host not in _allowed_hosts():
            raise UnsafeAgentEndpoint("Endpoint host is not approved for this deployment")
    return value


async def validate_outbound_agent_endpoint(value: str) -> str:
    """Revalidate the target and reject hosts resolving to non-public IP ranges."""
    parsed, host = _parse_endpoint(value)
    validate_agent_endpoint_url(value)
    port = parsed.port or (443 if parsed.scheme == "https" else 80)
    try:
        loop = asyncio.get_running_loop()
        addresses = await loop.getaddrinfo(host, port, type=socket.SOCK_STREAM)
    except socket.gaierror as error:
        raise UnsafeAgentEndpoint("Endpoint host could not be resolved") from error

    if settings.app_env == "production":
        for address in addresses:
            ip_address = ipaddress.ip_address(address[4][0].split("%", 1)[0])
            if not ip_address.is_global:
                raise UnsafeAgentEndpoint("Endpoint host must resolve to a public IP address")
    return value
