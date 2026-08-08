"""Client-IP extraction with opt-in reverse-proxy support."""

from fastapi import Request

from app.core.config import settings


def get_client_ip(request: Request) -> str:
    """Return the direct client IP unless configured trusted proxies provide X-Forwarded-For."""
    cached_ip = getattr(request.state, "client_ip", None)
    if cached_ip:
        return cached_ip

    direct_ip = request.client.host if request.client else "unknown"
    trusted_proxy_ips = {
        ip.strip() for ip in settings.trusted_proxy_ips.split(",") if ip.strip()
    }
    if settings.trusted_proxy_count <= 0 or direct_ip not in trusted_proxy_ips:
        request.state.client_ip = direct_ip
        return direct_ip

    forwarded_for = request.headers.get("x-forwarded-for", "")
    addresses = [address.strip() for address in forwarded_for.split(",") if address.strip()]
    if len(addresses) > settings.trusted_proxy_count:
        client_ip = addresses[-(settings.trusted_proxy_count + 1)]
    else:
        client_ip = direct_ip
    request.state.client_ip = client_ip
    return client_ip
