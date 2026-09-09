"""SSRF protection and URL validation utilities for VeritasAI.

Ensures that user-submitted URLs target only public, routable destinations
and never private, internal, link-local, or loopback networks.
"""

from __future__ import annotations

import asyncio
import ipaddress
import re
import socket
import urllib.parse
from typing import Sequence

import structlog

logger = structlog.get_logger(__name__)

# Max allowed URL length
MAX_URL_LENGTH = 2048

# Allowed protocols
ALLOWED_SCHEMES = {"http", "https"}

# Localhost and reserved hostname patterns
LOCAL_HOSTNAMES = {
    "localhost",
    "localhost.localdomain",
    "ip6-localhost",
    "ip6-loopback",
}

LOCAL_TLD_PATTERN = re.compile(
    r"\.(local|internal|lan|home|corp|test|example|invalid|onion|arpa)$",
    re.IGNORECASE,
)

# Forbidden IPv4 ranges
FORBIDDEN_IPV4_NETWORKS: Sequence[ipaddress.IPv4Network] = [
    ipaddress.ip_network("0.0.0.0/8"),          # Current network (only valid as source)
    ipaddress.ip_network("10.0.0.0/8"),         # Private class A
    ipaddress.ip_network("100.64.0.0/10"),      # Carrier-grade NAT
    ipaddress.ip_network("127.0.0.0/8"),        # Loopback
    ipaddress.ip_network("169.254.0.0/16"),     # Link-local / Cloud metadata
    ipaddress.ip_network("172.16.0.0/12"),      # Private class B
    ipaddress.ip_network("192.0.0.0/24"),       # IETF Protocol assignments
    ipaddress.ip_network("192.0.2.0/24"),       # Documentation (TEST-NET-1)
    ipaddress.ip_network("192.168.0.0/16"),     # Private class C
    ipaddress.ip_network("198.18.0.0/15"),      # Network benchmark tests
    ipaddress.ip_network("198.51.100.0/24"),    # Documentation (TEST-NET-2)
    ipaddress.ip_network("203.0.113.0/24"),     # Documentation (TEST-NET-3)
    ipaddress.ip_network("224.0.0.0/4"),        # Multicast
    ipaddress.ip_network("240.0.0.0/4"),        # Reserved for future use
    ipaddress.ip_network("255.255.255.255/32"), # Limited broadcast
]

# Forbidden IPv6 ranges
FORBIDDEN_IPV6_NETWORKS: Sequence[ipaddress.IPv6Network] = [
    ipaddress.ip_network("::/128"),             # Unspecified
    ipaddress.ip_network("::1/128"),            # Loopback
    ipaddress.ip_network("fc00::/7"),           # Unique local address (ULA)
    ipaddress.ip_network("fe80::/10"),          # Link-local unicast
    ipaddress.ip_network("ff00::/8"),           # Multicast
    ipaddress.ip_network("2001:db8::/32"),      # Documentation
]


class UrlValidationError(Exception):
    """Raised when URL format or protocol is invalid."""
    pass


class SSRFSecurityError(Exception):
    """Raised when URL targets a forbidden private/internal network."""
    pass


class UrlResolutionError(Exception):
    """Raised when DNS resolution fails."""
    pass


def validate_url_syntax(url: str) -> urllib.parse.SplitResult:
    """Validate basic URL structure, length, and protocol.

    Args:
        url: The raw user-provided URL string.

    Returns:
        The parsed SplitResult.

    Raises:
        UrlValidationError: If URL structure, scheme, or hostname is invalid.
    """
    if not url or not isinstance(url, str):
        raise UrlValidationError("Please enter a valid HTTP or HTTPS URL.")

    url = url.strip()

    if not url:
        raise UrlValidationError("Please enter a valid HTTP or HTTPS URL.")

    if len(url) > MAX_URL_LENGTH:
        raise UrlValidationError(
            f"URL exceeds maximum allowed length of {MAX_URL_LENGTH} characters."
        )

    try:
        parsed = urllib.parse.urlsplit(url)
    except Exception as exc:
        raise UrlValidationError("Please enter a valid HTTP or HTTPS URL.") from exc

    scheme = (parsed.scheme or "").lower()
    if not scheme:
        raise UrlValidationError("URL must include protocol (http:// or https://).")

    if scheme not in ALLOWED_SCHEMES:
        raise UrlValidationError(
            f"Unsupported protocol '{scheme}'. Only HTTP and HTTPS are permitted."
        )

    if not parsed.netloc or not parsed.hostname:
        raise UrlValidationError("URL must include a valid hostname.")

    # Disallow userinfo (e.g. http://user:pass@host/)
    if parsed.username or parsed.password:
        raise UrlValidationError("URLs containing credentials are not permitted.")

    hostname = parsed.hostname.lower()

    # Reject localhost names
    if hostname in LOCAL_HOSTNAMES or LOCAL_TLD_PATTERN.search(hostname):
        raise SSRFSecurityError("This URL cannot be accessed for security reasons.")

    return parsed


def is_ip_address_forbidden(ip: ipaddress.IPv4Address | ipaddress.IPv6Address) -> bool:
    """Check if an IP address belongs to any private, loopback, or reserved range.

    Args:
        ip: IPv4Address or IPv6Address to evaluate.

    Returns:
        True if the IP is forbidden (SSRF risk), False if public.
    """
    # Unpack IPv4-mapped IPv6 addresses (e.g. ::ffff:127.0.0.1)
    if isinstance(ip, ipaddress.IPv6Address) and ip.ipv4_mapped:
        ip = ip.ipv4_mapped

    if (
        ip.is_loopback
        or ip.is_private
        or ip.is_link_local
        or ip.is_multicast
        or ip.is_reserved
        or ip.is_unspecified
    ):
        return True

    if isinstance(ip, ipaddress.IPv4Address):
        for network in FORBIDDEN_IPV4_NETWORKS:
            if ip in network:
                return True
    elif isinstance(ip, ipaddress.IPv6Address):
        for network in FORBIDDEN_IPV6_NETWORKS:
            if ip in network:
                return True

    return False


async def resolve_and_validate_hostname(hostname: str, port: int) -> list[str]:
    """Resolve a hostname via DNS and ensure all resulting IPs are public.

    Args:
        hostname: The hostname to resolve.
        port: The target port (80 or 443).

    Returns:
        List of validated public IP strings.

    Raises:
        SSRFSecurityError: If any resolved IP is in a forbidden range.
        UrlResolutionError: If DNS resolution fails.
    """
    # Direct IP literal check first
    try:
        direct_ip = ipaddress.ip_address(hostname)
        if is_ip_address_forbidden(direct_ip):
            logger.warning("ssrf_direct_ip_blocked", ip=str(direct_ip))
            raise SSRFSecurityError("This URL cannot be accessed for security reasons.")
        return [str(direct_ip)]
    except ValueError:
        # Not a raw IP address, proceed to DNS resolution
        pass

    try:
        # Run DNS resolution in a worker thread to avoid blocking the event loop
        addrinfo = await asyncio.to_thread(
            socket.getaddrinfo,
            hostname,
            port,
            socket.AF_UNSPEC,
            socket.SOCK_STREAM,
        )
    except socket.gaierror as exc:
        logger.info("dns_resolution_failed", hostname=hostname, error=str(exc))
        raise UrlResolutionError("The webpage could not be reached.") from exc
    except Exception as exc:
        logger.error("dns_unexpected_error", hostname=hostname, error=str(exc))
        raise UrlResolutionError("The webpage could not be reached.") from exc

    if not addrinfo:
        raise UrlResolutionError("The webpage could not be reached.")

    validated_ips: list[str] = []
    for _family, _socktype, _proto, _canonname, sockaddr in addrinfo:
        ip_str = sockaddr[0]
        try:
            ip_obj = ipaddress.ip_address(ip_str)
        except ValueError:
            raise SSRFSecurityError("This URL cannot be accessed for security reasons.")

        if is_ip_address_forbidden(ip_obj):
            logger.warning(
                "ssrf_resolved_ip_blocked",
                hostname=hostname,
                blocked_ip=ip_str,
            )
            raise SSRFSecurityError("This URL cannot be accessed for security reasons.")

        if ip_str not in validated_ips:
            validated_ips.append(ip_str)

    if not validated_ips:
        raise SSRFSecurityError("This URL cannot be accessed for security reasons.")

    return validated_ips


async def validate_url_for_ssrf(url: str) -> tuple[str, str, int]:
    """Perform full syntactic and DNS/IP SSRF validation on a URL.

    Args:
        url: The candidate URL string.

    Returns:
        Tuple of (normalized_url, hostname, port).

    Raises:
        UrlValidationError: On invalid syntax or protocol.
        SSRFSecurityError: On forbidden private/internal destinations.
        UrlResolutionError: If hostname cannot be resolved.
    """
    parsed = validate_url_syntax(url)
    hostname = parsed.hostname.lower()
    port = parsed.port or (443 if parsed.scheme.lower() == "https" else 80)

    # Resolve and assert that EVERY returned address is safely public
    await resolve_and_validate_hostname(hostname, port)

    normalized_url = parsed.geturl()
    return normalized_url, hostname, port
