import re
import ipaddress
from urllib.parse import urlsplit, urlunsplit, parse_qsl, urlencode
from typing import Optional


class IndicatorNormalizer:
    """Provides RFC-compliant, privacy-conscious normalization for threat intelligence indicators."""

    @staticmethod
    def normalize_domain(domain: str) -> str:
        """Normalizes domain strings: lowercase, trailing dots removed, IDN/punycode decoded, ports stripped."""
        if not domain:
            return ""
        d = domain.strip().lower()

        # Remove scheme if prepended
        if "://" in d:
            d = d.split("://", 1)[1]

        # Strip path or query if passed
        d = d.split("/", 1)[0].split("?", 1)[0].split("#", 1)[0]

        # Strip userinfo (user:pass@)
        if "@" in d:
            d = d.split("@", 1)[1]

        # Strip port
        if ":" in d and not d.startswith("["):
            d = d.split(":", 1)[0]
        elif d.startswith("[") and "]" in d:
            d = d.split("]", 1)[0] + "]"

        # Strip leading and trailing dots
        d = d.strip(".")

        # Handle IDN / Punycode decoding safely
        try:
            # If punycode, decode to unicode for consistent comparison
            if "xn--" in d:
                d = d.encode("ascii").decode("idna").lower()
        except Exception:
            pass

        return d

    @staticmethod
    def normalize_url(url: str) -> str:
        """Normalizes URLs: scheme/netloc lowercase, default ports stripped, fragments dropped, trailing slashes trimmed."""
        if not url:
            return ""
        raw = url.strip()
        if not re.match(r"^[a-zA-Z][a-zA-Z0-9+.-]*://", raw):
            raw = "http://" + raw

        try:
            parts = urlsplit(raw)
            scheme = parts.scheme.lower()
            netloc = parts.netloc.lower()

            # Remove default ports
            if scheme == "http" and netloc.endswith(":80"):
                netloc = netloc[:-3]
            elif scheme == "https" and netloc.endswith(":443"):
                netloc = netloc[:-4]

            path = parts.path or "/"
            # Normalize path slashes
            path = re.sub(r"/+", "/", path)
            if len(path) > 1 and path.endswith("/"):
                path = path[:-1]

            # Canonicalize query parameters (sorted keys)
            if parts.query:
                query_tuples = sorted(parse_qsl(parts.query, keep_blank_values=True))
                query = urlencode(query_tuples)
            else:
                query = ""

            # Fragment is omitted for identity comparison
            normalized = urlunsplit((scheme, netloc, path, query, ""))
            return normalized
        except Exception:
            return raw.lower().split("#")[0]

    @staticmethod
    def normalize_ip(ip: str) -> str:
        """Normalizes IPv4 and IPv6 addresses into standard canonical representations."""
        if not ip:
            return ""
        clean_ip = ip.strip().strip("[]").split(":")[0] if "." in ip and ":" in ip else ip.strip().strip("[]")
        try:
            addr = ipaddress.ip_address(clean_ip)
            return str(addr)
        except ValueError:
            # Return lowercase stripped string if unable to parse as formal IP
            return ip.strip().lower()

    @staticmethod
    def normalize_cert_fingerprint(fp: str) -> str:
        """Normalizes SHA-1 / SHA-256 certificate fingerprints or serial identifiers."""
        if not fp:
            return ""
        clean_fp = fp.strip()
        if clean_fp.upper().startswith("SERIAL-"):
            clean_digits = re.sub(r"[^a-fA-F0-9]", "", clean_fp[7:]).upper()
            return f"SERIAL-{clean_digits}"
        # Remove colons, spaces, hyphens
        clean = re.sub(r"[^a-fA-F0-9]", "", clean_fp).upper()
        if not clean:
            return clean_fp.upper()
        # Format as colon-separated pairs (e.g. AA:BB:CC)
        return ":".join(clean[i : i + 2] for i in range(0, len(clean), 2))

    @staticmethod
    def normalize_cert_issuer(issuer: str) -> str:
        """Normalizes certificate authority / issuer names to a concise canonical string."""
        if not issuer:
            return "UNKNOWN_ISSUER"
        iss = issuer.strip()
        # Extract Common Name (CN) or Organization (O) if in X.500 DN format
        cn_match = re.search(r"CN\s*=\s*([^,;/]+)", iss, re.IGNORECASE)
        o_match = re.search(r"O\s*=\s*([^,;/]+)", iss, re.IGNORECASE)
        if cn_match:
            return cn_match.group(1).strip()
        if o_match:
            return o_match.group(1).strip()
        return iss

    @staticmethod
    def normalize_email(email: str) -> str:
        """Normalizes email addresses to lowercase with stripped whitespace."""
        if not email:
            return ""
        return email.strip().lower()

    @staticmethod
    def normalize_phone(phone: str) -> str:
        """Normalizes telephone / SMS contact strings to E.164-like stripped digit sequences."""
        if not phone:
            return ""
        p = phone.strip()
        has_plus = p.startswith("+")
        digits = re.sub(r"\D", "", p)
        return f"+{digits}" if has_plus else digits

    @classmethod
    def normalize(cls, indicator_type: str, raw_value: str) -> str:
        """Generic dispatcher for any indicator type."""
        itype = indicator_type.upper().strip()
        if itype in ("DOMAIN", "HOSTNAME"):
            return cls.normalize_domain(raw_value)
        elif itype in ("URL", "LINK"):
            return cls.normalize_url(raw_value)
        elif itype in ("IP", "IPV4", "IPV6"):
            return cls.normalize_ip(raw_value)
        elif itype in ("CERT_FINGERPRINT", "CERTIFICATE", "FINGERPRINT"):
            return cls.normalize_cert_fingerprint(raw_value)
        elif itype in ("CERT_ISSUER", "ISSUER", "CA"):
            return cls.normalize_cert_issuer(raw_value)
        elif itype in ("EMAIL", "EMAIL_ADDRESS"):
            return cls.normalize_email(raw_value)
        elif itype in ("PHONE", "PHONE_NUMBER", "SMS_SENDER"):
            return cls.normalize_phone(raw_value)
        return raw_value.strip()
