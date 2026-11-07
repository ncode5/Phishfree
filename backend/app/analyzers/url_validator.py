import ipaddress
import re
from dataclasses import dataclass, field
from typing import List, Optional
from urllib.parse import urlparse, urlunparse, quote, unquote

# Forbidden schemes that represent obvious security risks or non-web protocols
DISALLOWED_SCHEMES = {
    "file", "javascript", "data", "ftp", "ftps", "gopher", "ldap",
    "mailto", "tel", "ssh", "sftp", "vnc", "dict", "jar", "netdoc"
}

# Private and internal IP subnets to guard against SSRF
PRIVATE_SUBNETS = [
    ipaddress.ip_network("127.0.0.0/8"),      # Loopback IPv4
    ipaddress.ip_network("10.0.0.0/8"),       # Private Class A
    ipaddress.ip_network("172.16.0.0/12"),    # Private Class B
    ipaddress.ip_network("192.168.0.0/16"),   # Private Class C
    ipaddress.ip_network("169.254.0.0/16"),   # Link-Local / AWS & Cloud Metadata (169.254.169.254)
    ipaddress.ip_network("0.0.0.0/8"),        # Current network
    ipaddress.ip_network("100.64.0.0/10"),    # Carrier-grade NAT
    ipaddress.ip_network("192.0.0.0/24"),     # IETF Protocol
    ipaddress.ip_network("192.0.2.0/24"),     # TEST-NET-1
    ipaddress.ip_network("198.51.100.0/24"),  # TEST-NET-2
    ipaddress.ip_network("203.0.113.0/24"),   # TEST-NET-3
    ipaddress.ip_network("224.0.0.0/4"),      # Multicast
    ipaddress.ip_network("240.0.0.0/4"),      # Reserved
    ipaddress.ip_network("::1/128"),          # Loopback IPv6
    ipaddress.ip_network("fc00::/7"),         # Unique local IPv6
    ipaddress.ip_network("fe80::/10"),        # Link-local IPv6
]


@dataclass
class ValidationResult:
    is_valid: bool
    submitted_url: str
    normalized_url: str = ""
    hostname: str = ""
    port: Optional[int] = None
    scheme: str = ""
    path: str = ""
    query: str = ""
    is_ip_address: bool = False
    is_private_ip: bool = False
    error_message: Optional[str] = None
    warnings: List[str] = field(default_factory=list)


def is_ip_private(ip_str: str) -> bool:
    """Checks whether an IP address belongs to loopback, private, or link-local ranges."""
    try:
        ip = ipaddress.ip_address(ip_str.strip("[]"))
        return any(ip in subnet for subnet in PRIVATE_SUBNETS)
    except ValueError:
        return False


def validate_hostname(hostname: str) -> bool:
    """Validates hostname according to RFC 1123 / RFC 952."""
    if not hostname or len(hostname) > 253:
        return False

    # Check if IPv6 in brackets
    if hostname.startswith("[") and hostname.endswith("]"):
        try:
            ipaddress.IPv6Address(hostname[1:-1])
            return True
        except ValueError:
            return False

    # Strip trailing dot if present
    if hostname.endswith("."):
        hostname = hostname[:-1]

    # Check IPv4 literal
    try:
        ipaddress.IPv4Address(hostname)
        return True
    except ValueError:
        pass

    # Domain name regex
    label_pattern = re.compile(r"^(?!-)[a-zA-Z0-9-_]{1,63}(?<!-)$")
    labels = hostname.split(".")
    return all(label_pattern.match(label) for label in labels)


class URLValidator:
    """Validates, sanitizes, and normalizes submitted URLs."""

    @staticmethod
    def validate_and_normalize(url: str) -> ValidationResult:
        if not url or not isinstance(url, str):
            return ValidationResult(
                is_valid=False,
                submitted_url=str(url),
                error_message="Empty or invalid URL payload."
            )

        cleaned_url = url.strip()
        warnings = []

        if len(cleaned_url) > 2048:
            return ValidationResult(
                is_valid=False,
                submitted_url=cleaned_url,
                error_message="URL length exceeds maximum limit of 2048 characters."
            )

        # Detect if a scheme is present (e.g. "javascript:", "file:", "http://")
        scheme_match = re.match(r"^([a-zA-Z][a-zA-Z0-9+.-]*):", cleaned_url)
        if scheme_match:
            detected_scheme = scheme_match.group(1).lower()
            if detected_scheme in DISALLOWED_SCHEMES:
                return ValidationResult(
                    is_valid=False,
                    submitted_url=url,
                    scheme=detected_scheme,
                    error_message=f"Disallowed protocol '{detected_scheme}:'. Only HTTP and HTTPS are permitted."
                )
            if detected_scheme not in ("http", "https"):
                return ValidationResult(
                    is_valid=False,
                    submitted_url=url,
                    scheme=detected_scheme,
                    error_message=f"Unsupported protocol '{detected_scheme}:'. Only HTTP and HTTPS are supported."
                )

        if "://" not in cleaned_url:
            # Handle user submitting bare domain or domain/path (e.g., "paypal.com" or "example.com/login")
            cleaned_url = "http://" + cleaned_url
            warnings.append("No protocol specified; defaulted to http:// for inspection.")

        try:
            parsed = urlparse(cleaned_url)
        except Exception as e:
            return ValidationResult(
                is_valid=False,
                submitted_url=url,
                error_message=f"Malformed URL structure: {str(e)}"
            )

        scheme = (parsed.scheme or "").lower()

        # Enforce HTTP and HTTPS only
        if scheme in DISALLOWED_SCHEMES:
            return ValidationResult(
                is_valid=False,
                submitted_url=url,
                scheme=scheme,
                error_message=f"Disallowed protocol '{scheme}://'. Only HTTP and HTTPS are permitted."
            )

        if scheme not in ("http", "https"):
            return ValidationResult(
                is_valid=False,
                submitted_url=url,
                scheme=scheme,
                error_message=f"Unsupported protocol '{scheme}'. Only HTTP and HTTPS are supported."
            )

        netloc = parsed.netloc
        if not netloc:
            return ValidationResult(
                is_valid=False,
                submitted_url=url,
                scheme=scheme,
                error_message="Missing hostname or network authority in URL."
            )

        # Separate userinfo, hostname, and port
        userinfo = ""
        host_port = netloc
        if "@" in netloc:
            userinfo, host_port = netloc.split("@", 1)
            warnings.append("URL contains embedded user credentials ('@' symbol), a common phishing obfuscation technique.")

        port = None
        hostname = host_port
        if ":" in host_port and not host_port.endswith("]"):
            # Check for port
            parts = host_port.rsplit(":", 1)
            hostname = parts[0]
            try:
                port = int(parts[1])
                if not (1 <= port <= 65535):
                    return ValidationResult(
                        is_valid=False,
                        submitted_url=url,
                        error_message=f"Invalid port number: {parts[1]}"
                    )
            except ValueError:
                return ValidationResult(
                    is_valid=False,
                    submitted_url=url,
                    error_message=f"Malformed port specification: {parts[1]}"
                )

        hostname = hostname.lower()

        # Validate hostname syntax
        if not validate_hostname(hostname):
            return ValidationResult(
                is_valid=False,
                submitted_url=url,
                error_message=f"Invalid hostname format: '{hostname}'."
            )

        # Check if hostname is an IP address
        is_ip = False
        is_priv = False
        try:
            clean_ip = hostname.strip("[]")
            ipaddress.ip_address(clean_ip)
            is_ip = True
            is_priv = is_ip_private(clean_ip)
            if is_priv:
                return ValidationResult(
                    is_valid=False,
                    submitted_url=url,
                    hostname=hostname,
                    is_ip_address=True,
                    is_private_ip=True,
                    error_message=f"Unsafe destination: IP address '{hostname}' targets a private, loopback, or cloud-metadata address (SSRF blocked)."
                )
        except ValueError:
            is_ip = False

        # Normalize port
        normalized_netloc = hostname
        if port:
            if (scheme == "http" and port != 80) or (scheme == "https" and port != 443):
                normalized_netloc = f"{hostname}:{port}"
        if userinfo:
            normalized_netloc = f"{userinfo}@{normalized_netloc}"

        # Clean path
        path = parsed.path or "/"

        # Normalize dot segments
        path_segments = []
        for segment in path.split("/"):
            if segment == "..":
                if path_segments:
                    path_segments.pop()
            elif segment != "." and segment != "":
                path_segments.append(segment)
        normalized_path = "/" + "/".join(path_segments)
        if path.endswith("/") and not normalized_path.endswith("/"):
            normalized_path += "/"

        # Reconstruct canonical normalized URL
        normalized_url = urlunparse((
            scheme,
            normalized_netloc,
            normalized_path,
            parsed.params,
            parsed.query,
            ""  # Exclude fragment from normalized URL for security analysis
        ))

        return ValidationResult(
            is_valid=True,
            submitted_url=url,
            normalized_url=normalized_url,
            hostname=hostname,
            port=port,
            scheme=scheme,
            path=normalized_path,
            query=parsed.query,
            is_ip_address=is_ip,
            is_private_ip=is_priv,
            warnings=warnings
        )
