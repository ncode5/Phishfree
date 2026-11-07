import asyncio
import datetime
from datetime import timezone
import ipaddress
import re
import socket
import ssl
from typing import Dict, Any, List, Optional, Tuple
from urllib.parse import urlparse

import httpx
import tldextract
from cryptography import x509
from cryptography.x509.oid import ExtensionOID, NameOID
from cryptography.hazmat.primitives.asymmetric import rsa, ec

from app.analyzers.url_validator import is_ip_private
from app.database import schemas


class TLSAnalyzer:
    """Module 2: Comprehensive TLS Certificate & Digital Trust Analysis Service."""

    def __init__(self, timeout: float = 3.5):
        self.timeout = timeout
        self.extractor = tldextract.TLDExtract(cache_dir=None)

    def clean_target(self, target: str) -> Tuple[str, int]:
        """Extracts cleaned hostname and port from a URL or domain string."""
        raw = target.strip()
        if not raw.startswith("http://") and not raw.startswith("https://"):
            raw = "https://" + raw

        try:
            parsed = urlparse(raw)
            hostname = parsed.hostname or ""
            port = parsed.port or 443
            return hostname.lower(), port
        except Exception:
            # Fallback simple split
            parts = target.split("/")[0].split(":")
            hostname = parts[0].strip().lower()
            port = int(parts[1]) if len(parts) > 1 and parts[1].isdigit() else 443
            return hostname, port

    def _resolve_and_check_ssrf(self, hostname: str) -> Tuple[bool, Optional[str], Optional[str]]:
        """Resolves DNS and validates against private/loopback/cloud metadata IP ranges (SSRF defense)."""
        try:
            # Check if host is direct IP
            clean_host = hostname.strip("[]")
            try:
                ip_obj = ipaddress.ip_address(clean_host)
                if is_ip_private(str(ip_obj)):
                    return False, str(ip_obj), f"Direct IP destination '{clean_host}' is in a private/restricted subnet (SSRF blocked)."
                return True, str(ip_obj), None
            except ValueError:
                pass

            # Resolve hostname
            resolved_ip = socket.gethostbyname(hostname)
            if is_ip_private(resolved_ip):
                return False, resolved_ip, f"Resolved IP '{resolved_ip}' for '{hostname}' belongs to a private/internal network (SSRF blocked)."

            return True, resolved_ip, None
        except socket.gaierror:
            return False, None, f"DNS resolution failed for hostname '{hostname}'."
        except Exception as e:
            return False, None, f"DNS validation error: {str(e)}"

    def _match_hostname_san(self, hostname: str, san_list: List[str], common_name: Optional[str]) -> bool:
        """Verifies if hostname matches SAN DNS entries or Common Name with wildcard support."""
        candidates = list(san_list)
        if common_name and common_name not in candidates:
            candidates.append(common_name)

        clean_host = hostname.lower().strip(".")

        for pattern in candidates:
            pattern = pattern.lower().strip(".")
            if pattern == clean_host:
                return True

            # Wildcard matching (e.g. *.example.com)
            if pattern.startswith("*."):
                suffix = pattern[2:]
                host_parts = clean_host.split(".")
                pattern_parts = pattern.split(".")
                # RFC 6125: Wildcard only matches single leftmost label
                if len(host_parts) == len(pattern_parts) and clean_host.endswith("." + suffix):
                    return True

        return False

    def _format_serial_number(self, serial: int) -> str:
        """Formats an integer serial number as hex with colon delimiters."""
        hex_str = format(serial, "X")
        if len(hex_str) % 2 != 0:
            hex_str = "0" + hex_str
        return ":".join(hex_str[i:i+2] for i in range(0, len(hex_str), 2))

    def _extract_x509_metadata(self, cert_der: bytes) -> schemas.CertificateInfoSchema:
        """Parses raw DER certificate using cryptography.x509."""
        cert = x509.load_der_x509_certificate(cert_der)

        # Subject
        subject_dict = {}
        for attr in cert.subject:
            oid_name = attr.oid._name
            if oid_name == "commonName":
                subject_dict["common_name"] = attr.value
            elif oid_name == "organizationName":
                subject_dict["organization"] = attr.value
            elif oid_name == "countryName":
                subject_dict["country"] = attr.value

        # Issuer
        issuer_dict = {}
        for attr in cert.issuer:
            oid_name = attr.oid._name
            if oid_name == "commonName":
                issuer_dict["common_name"] = attr.value
            elif oid_name == "organizationName":
                issuer_dict["organization"] = attr.value
            elif oid_name == "countryName":
                issuer_dict["country"] = attr.value

        # Serial number
        serial = self._format_serial_number(cert.serial_number)

        # Dates (UTC-aware)
        try:
            valid_from = cert.not_valid_before_utc
            valid_to = cert.not_valid_after_utc
        except AttributeError:
            # Compatibility for older cryptography versions
            valid_from = cert.not_valid_before.replace(tzinfo=timezone.utc)
            valid_to = cert.not_valid_after.replace(tzinfo=timezone.utc)

        now = datetime.datetime.now(timezone.utc)
        days_remaining = (valid_to - now).days

        # SAN
        san_list = []
        try:
            san_ext = cert.extensions.get_extension_for_oid(ExtensionOID.SUBJECT_ALTERNATIVE_NAME)
            san_list = [name.value for name in san_ext.value if isinstance(name, x509.DNSName)]
        except Exception:
            pass

        # Public Key details
        pub_key = cert.public_key()
        pub_key_alg = "Unknown"
        pub_key_size = None
        curve_name = None

        if isinstance(pub_key, rsa.RSAPublicKey):
            pub_key_alg = "RSA"
            pub_key_size = pub_key.key_size
        elif isinstance(pub_key, ec.EllipticCurvePublicKey):
            pub_key_alg = "ECDSA"
            pub_key_size = pub_key.key_size
            curve_name = pub_key.curve.name
        else:
            pub_key_alg = type(pub_key).__name__

        # Signature Algorithm
        sig_alg = "Unknown"
        try:
            sig_alg = cert.signature_algorithm_oid._name
        except Exception:
            try:
                sig_alg = cert.signature_hash_algorithm.name
            except Exception:
                pass

        return schemas.CertificateInfoSchema(
            subject=subject_dict,
            issuer=issuer_dict,
            serial_number=serial,
            valid_from=valid_from,
            valid_to=valid_to,
            days_remaining=days_remaining,
            san=san_list,
            public_key_algorithm=pub_key_alg,
            public_key_size=pub_key_size,
            signature_algorithm=sig_alg,
            curve=curve_name
        )

    def _sync_tls_handshake(self, hostname: str, port: int) -> Dict[str, Any]:
        """Performs network TLS handshake and returns raw telemetry."""
        result = {
            "https_available": False,
            "tls_version": None,
            "cipher_suite": None,
            "chain_trusted": False,
            "verification_error": None,
            "cert_der": None,
            "error": None
        }

        # 1. Attempt verified connection first
        verified_context = ssl.create_default_context()
        verified_context.check_hostname = True
        verified_context.verify_mode = ssl.CERT_REQUIRED

        try:
            with socket.create_connection((hostname, port), timeout=self.timeout) as sock:
                with verified_context.wrap_socket(sock, server_hostname=hostname) as ssock:
                    result["https_available"] = True
                    result["tls_version"] = ssock.version()
                    result["cipher_suite"] = ssock.cipher()[0] if ssock.cipher() else None
                    result["chain_trusted"] = True
                    result["cert_der"] = ssock.getpeercert(binary_form=True)
                    return result
        except ssl.SSLCertVerificationError as e:
            result["https_available"] = True
            result["chain_trusted"] = False
            result["verification_error"] = str(e.verify_message if hasattr(e, "verify_message") else e)
        except ssl.SSLError as e:
            result["https_available"] = True
            result["chain_trusted"] = False
            result["verification_error"] = str(e)
        except (socket.timeout, TimeoutError):
            result["error"] = "Connection timed out during HTTPS handshake."
            return result
        except ConnectionRefusedError:
            result["error"] = f"HTTPS connection refused on {hostname}:{port}."
            return result
        except Exception as e:
            result["error"] = f"Unable to establish HTTPS connection: {str(e)}"
            return result

        # 2. If verification failed, open secondary unverified connection strictly to inspect the peer certificate
        try:
            unverified_context = ssl.create_default_context()
            unverified_context.check_hostname = False
            unverified_context.verify_mode = ssl.CERT_NONE

            with socket.create_connection((hostname, port), timeout=self.timeout) as sock:
                with unverified_context.wrap_socket(sock, server_hostname=hostname) as ssock:
                    result["tls_version"] = ssock.version()
                    result["cipher_suite"] = ssock.cipher()[0] if ssock.cipher() else None
                    result["cert_der"] = ssock.getpeercert(binary_form=True)
        except Exception as e:
            if not result.get("verification_error"):
                result["verification_error"] = str(e)

        return result

    async def _query_crt_sh(self, registered_domain: str) -> schemas.CertificateTransparencySchema:
        """Asynchronously queries public crt.sh Certificate Transparency logs."""
        if not registered_domain or "." not in registered_domain:
            return schemas.CertificateTransparencySchema(
                status="UNAVAILABLE",
                error_message="Invalid domain for Certificate Transparency lookup."
            )

        url = f"https://crt.sh/?q={registered_domain}&output=json"
        headers = {"User-Agent": "Mozilla/5.0 DigitalTrustIntel/1.0"}

        try:
            async with httpx.AsyncClient(timeout=3.5) as client:
                res = await client.get(url, headers=headers)
                if res.status_code == 429:
                    return schemas.CertificateTransparencySchema(
                        status="RATE_LIMITED",
                        error_message="Certificate Transparency API rate limit reached."
                    )
                if res.status_code != 200:
                    return schemas.CertificateTransparencySchema(
                        status="ERROR",
                        error_message=f"crt.sh responded with HTTP {res.status_code}"
                    )

                data = res.json()
                if not isinstance(data, list):
                    return schemas.CertificateTransparencySchema(
                        status="COMPLETED",
                        total_records=0
                    )

                issuers = set()
                sample_records = []
                recent_count = 0
                now = datetime.datetime.now(timezone.utc)
                ninety_days_ago = now - datetime.timedelta(days=90)

                for item in data[:50]:
                    issuer_name = item.get("issuer_name", "Unknown")
                    # Clean common issuer name
                    cn_match = re.search(r"CN=([^,]+)", issuer_name)
                    clean_issuer = cn_match.group(1) if cn_match else issuer_name
                    issuers.add(clean_issuer)

                    entry_date = item.get("entry_timestamp")
                    if entry_date:
                        try:
                            parsed_date = datetime.datetime.fromisoformat(entry_date.replace("Z", "+00:00"))
                            if parsed_date > ninety_days_ago:
                                recent_count += 1
                        except Exception:
                            pass

                    if len(sample_records) < 5:
                        sample_records.append({
                            "id": item.get("id"),
                            "issuer": clean_issuer,
                            "logged_at": item.get("entry_timestamp"),
                            "common_name": item.get("common_name")
                        })

                return schemas.CertificateTransparencySchema(
                    status="COMPLETED",
                    total_records=len(data),
                    distinct_issuers=sorted(list(issuers))[:5],
                    recent_certificates_count=recent_count,
                    sample_records=sample_records
                )
        except Exception as e:
            return schemas.CertificateTransparencySchema(
                status="UNAVAILABLE",
                error_message=f"Certificate Transparency lookup unavailable: {str(e)}"
            )

    async def analyze(self, target: str) -> schemas.TLSAnalysisResponse:
        """Executes full TLS Certificate & Digital Trust Analysis for a submitted domain or URL."""
        hostname, port = self.clean_target(target)
        findings: List[schemas.TLSFindingSchema] = []
        recommendations: List[str] = []

        if not hostname:
            return schemas.TLSAnalysisResponse(
                target=target,
                hostname="",
                port=port,
                https_available=False,
                certificate_status="UNABLE_TO_DETERMINE",
                error_message="Invalid target or missing hostname."
            )

        # 1. SSRF Protection
        is_safe_ip, resolved_ip, ssrf_error = self._resolve_and_check_ssrf(hostname)
        if not is_safe_ip:
            findings.append(schemas.TLSFindingSchema(
                finding_id="TLS_SSRF_BLOCKED",
                category="hostname_validation",
                title="SSRF Attempt Blocked",
                description=ssrf_error or "Target resolved to an internal, private, or metadata address.",
                severity="Critical",
                evidence={"hostname": hostname, "resolved_ip": resolved_ip},
                recommendation="Do not target private or internal network destinations.",
                confidence=1.0
            ))
            recommendations.append("Requests to internal or private IP ranges are blocked by security policy.")

            return schemas.TLSAnalysisResponse(
                target=target,
                hostname=hostname,
                port=port,
                https_available=False,
                certificate_status="UNTRUSTED",
                chain_status="UNABLE_TO_VERIFY",
                findings=findings,
                recommendations=recommendations,
                error_message=ssrf_error
            )

        # 2. Handshake (Async execution via threadpool to prevent event loop blocking)
        loop = asyncio.get_event_loop()
        handshake_data = await loop.run_in_executor(None, self._sync_tls_handshake, hostname, port)

        if not handshake_data["https_available"]:
            findings.append(schemas.TLSFindingSchema(
                finding_id="TLS_HTTPS_UNAVAILABLE",
                category="chain_validation",
                title="HTTPS Service Unavailable",
                description=handshake_data["error"] or f"Could not establish an HTTPS connection on {hostname}:{port}.",
                severity="Informational",
                evidence={"hostname": hostname, "port": port},
                recommendation="Ensure the web server is listening on port 443 with a valid TLS configuration.",
                confidence=1.0
            ))
            recommendations.append("Target does not appear to support HTTPS or port 443 is not exposed.")

            return schemas.TLSAnalysisResponse(
                target=target,
                hostname=hostname,
                port=port,
                https_available=False,
                certificate_status="UNABLE_TO_DETERMINE",
                chain_status="UNABLE_TO_VERIFY",
                findings=findings,
                recommendations=recommendations,
                error_message=handshake_data["error"]
            )

        # 3. Parse Certificate Metadata
        cert_info: Optional[schemas.CertificateInfoSchema] = None
        cert_der = handshake_data.get("cert_der")

        if cert_der:
            try:
                cert_info = self._extract_x509_metadata(cert_der)
            except Exception as e:
                findings.append(schemas.TLSFindingSchema(
                    finding_id="TLS_CERT_PARSE_ERROR",
                    category="chain_validation",
                    title="Certificate Parsing Error",
                    description=f"Failed to parse X.509 certificate metadata: {str(e)}",
                    severity="Medium",
                    evidence={"error": str(e)},
                    confidence=0.9
                ))

        # 4. Certificate Expiration & Validity Classification
        cert_status = "VALID"
        if cert_info and cert_info.valid_to:
            now = datetime.datetime.now(timezone.utc)
            if now > cert_info.valid_to:
                cert_status = "EXPIRED"
                days_ago = (now - cert_info.valid_to).days
                findings.append(schemas.TLSFindingSchema(
                    finding_id="TLS_CERT_EXPIRED",
                    category="certificate_expiration",
                    title="Certificate Expired",
                    description=f"The TLS certificate expired {days_ago} days ago on {cert_info.valid_to.strftime('%Y-%m-%d')}.",
                    severity="High",
                    evidence={"expired_on": str(cert_info.valid_to), "days_expired": days_ago},
                    recommendation="Renew the expired TLS certificate immediately with an authorized Certificate Authority.",
                    confidence=1.0
                ))
                recommendations.append("The website's TLS certificate has expired. Do not enter sensitive credentials.")
            elif cert_info.valid_from and now < cert_info.valid_from:
                cert_status = "NOT_YET_VALID"
                findings.append(schemas.TLSFindingSchema(
                    finding_id="TLS_CERT_NOT_YET_VALID",
                    category="certificate_expiration",
                    title="Certificate Not Yet Valid",
                    description=f"The certificate is not valid until {cert_info.valid_from.strftime('%Y-%m-%d')}.",
                    severity="Medium",
                    evidence={"valid_from": str(cert_info.valid_from)},
                    recommendation="Verify server system clocks and certificate issuance timestamp.",
                    confidence=1.0
                ))
                recommendations.append("Certificate validity period has not started yet. Inspect server time configurations.")
            elif cert_info.days_remaining is not None and cert_info.days_remaining <= 14:
                cert_status = "EXPIRING_SOON"
                findings.append(schemas.TLSFindingSchema(
                    finding_id="TLS_CERT_EXPIRING_SOON",
                    category="certificate_expiration",
                    title="Certificate Expiring Soon",
                    description=f"The certificate will expire in {cert_info.days_remaining} days ({cert_info.valid_to.strftime('%Y-%m-%d')}).",
                    severity="Medium",
                    evidence={"days_remaining": cert_info.days_remaining, "expires_on": str(cert_info.valid_to)},
                    recommendation="Initiate certificate renewal before service disruption occurs.",
                    confidence=1.0
                ))
                recommendations.append(f"Certificate expires in {cert_info.days_remaining} days. Schedule renewal.")
            else:
                findings.append(schemas.TLSFindingSchema(
                    finding_id="TLS_CERT_VALID",
                    category="certificate_expiration",
                    title="Certificate Valid",
                    description=f"Certificate is currently valid ({cert_info.days_remaining} days remaining). Note: A valid certificate does not guarantee a website is legitimate.",
                    severity="Informational",
                    evidence={"days_remaining": cert_info.days_remaining},
                    confidence=1.0
                ))

        # 5. Hostname / Domain Validation
        hostname_match = False
        if cert_info:
            cn = cert_info.subject.get("common_name")
            hostname_match = self._match_hostname_san(hostname, cert_info.san, cn)

            if hostname_match:
                findings.append(schemas.TLSFindingSchema(
                    finding_id="TLS_HOSTNAME_MATCH",
                    category="hostname_validation",
                    title="Hostname Match Verified",
                    description=f"Requested hostname '{hostname}' matches certificate Subject Alternative Names (SAN).",
                    severity="Informational",
                    evidence={"hostname": hostname, "san": cert_info.san[:5]},
                    confidence=1.0
                ))
            else:
                if cert_status == "VALID":
                    cert_status = "MISMATCHED"
                findings.append(schemas.TLSFindingSchema(
                    finding_id="TLS_HOSTNAME_MISMATCH",
                    category="hostname_validation",
                    title="Certificate Hostname Mismatch",
                    description=f"Requested hostname '{hostname}' is not listed in certificate Subject Alternative Names: {', '.join(cert_info.san[:4]) or cn or 'None'}.",
                    severity="High",
                    evidence={"hostname": hostname, "san": cert_info.san[:5], "common_name": cn},
                    recommendation="Ensure the TLS certificate is issued specifically for this domain name or covers it via wildcard.",
                    confidence=1.0
                ))
                recommendations.append(f"Hostname mismatch detected. The certificate was issued for {cert_info.san[:2] or cn}, not {hostname}.")

        # 6. Chain Validation
        chain_status = "TRUSTED"
        if handshake_data["chain_trusted"]:
            findings.append(schemas.TLSFindingSchema(
                finding_id="TLS_CHAIN_TRUSTED",
                category="chain_validation",
                title="Certificate Chain Trusted",
                description="The certificate trust chain successfully validated against standard Certificate Authority trust anchors.",
                severity="Informational",
                evidence={"issuer": cert_info.issuer if cert_info else {}},
                confidence=1.0
            ))
        else:
            verify_err = handshake_data.get("verification_error", "")
            is_self_signed = False
            if cert_info and cert_info.subject == cert_info.issuer:
                is_self_signed = True

            if is_self_signed:
                chain_status = "SELF_SIGNED"
                findings.append(schemas.TLSFindingSchema(
                    finding_id="TLS_SELF_SIGNED",
                    category="chain_validation",
                    title="Self-Signed Certificate Detected",
                    description="The certificate is self-signed and was not issued by an accredited public Certificate Authority.",
                    severity="Medium",
                    evidence={"subject": cert_info.subject, "issuer": cert_info.issuer},
                    recommendation="Use certificates issued by recognized public CAs (e.g. Let's Encrypt, DigiCert) for public web services.",
                    confidence=1.0
                ))
                recommendations.append("Website uses a self-signed certificate, which cannot be independently validated.")
            else:
                chain_status = "UNTRUSTED"
                findings.append(schemas.TLSFindingSchema(
                    finding_id="TLS_CHAIN_UNTRUSTED",
                    category="chain_validation",
                    title="Untrusted Certificate Chain",
                    description=f"Certificate chain validation failed: {verify_err or 'Issuer not trusted by root store'}.",
                    severity="High",
                    evidence={"verification_error": verify_err},
                    recommendation="Install intermediate certificates and verify that the issuing CA is recognized.",
                    confidence=1.0
                ))
                recommendations.append("The certificate chain is untrusted or incomplete. Browsers will trigger security warnings.")

        # 7. Cryptographic Configuration
        crypto_strength = "ACCEPTABLE"
        tls_version = handshake_data.get("tls_version", "")

        if tls_version in ("TLSv1.3", "TLS 1.3"):
            crypto_strength = "STRONG"
            findings.append(schemas.TLSFindingSchema(
                finding_id="TLS_MODERN_PROTOCOL",
                category="cryptographic_strength",
                title="Modern TLS Protocol Negotiated",
                description=f"Negotiated modern {tls_version} with cipher suite {handshake_data.get('cipher_suite')}.",
                severity="Informational",
                evidence={"version": tls_version, "cipher": handshake_data.get("cipher_suite")},
                confidence=1.0
            ))
        elif tls_version in ("TLSv1.2", "TLS 1.2"):
            crypto_strength = "ACCEPTABLE"
            findings.append(schemas.TLSFindingSchema(
                finding_id="TLS_STANDARD_PROTOCOL",
                category="cryptographic_strength",
                title="Standard TLS Protocol Negotiated",
                description=f"Negotiated {tls_version} with cipher suite {handshake_data.get('cipher_suite')}.",
                severity="Informational",
                evidence={"version": tls_version, "cipher": handshake_data.get("cipher_suite")},
                confidence=1.0
            ))
        elif tls_version in ("TLSv1", "TLSv1.1", "SSLv3", "SSLv2"):
            crypto_strength = "WEAK"
            findings.append(schemas.TLSFindingSchema(
                finding_id="TLS_DEPRECATED_PROTOCOL",
                category="cryptographic_strength",
                title="Deprecated TLS Protocol",
                description=f"Negotiated deprecated protocol ({tls_version}). TLS 1.0 and 1.1 are vulnerable and deprecated by RFC 8996.",
                severity="High",
                evidence={"version": tls_version},
                recommendation="Disable TLS 1.0 and 1.1 and upgrade to TLS 1.2 or TLS 1.3.",
                confidence=1.0
            ))
            recommendations.append(f"Server uses legacy {tls_version}. Upgrade to TLS 1.3.")

        if cert_info:
            if cert_info.public_key_algorithm == "RSA" and cert_info.public_key_size:
                if cert_info.public_key_size < 2048:
                    crypto_strength = "WEAK"
                    findings.append(schemas.TLSFindingSchema(
                        finding_id="TLS_WEAK_RSA_KEY",
                        category="cryptographic_strength",
                        title="Weak RSA Key Size",
                        description=f"Certificate uses a {cert_info.public_key_size}-bit RSA key, which is below the modern 2048-bit minimum security standard.",
                        severity="High",
                        evidence={"key_size": cert_info.public_key_size},
                        recommendation="Reissue certificate with an RSA key of at least 2048 bits or an ECC key (secp256r1).",
                        confidence=1.0
                    ))
                    recommendations.append("RSA key size is weak (< 2048 bits). Reissue certificate with 2048+ bits.")
                elif cert_info.public_key_size >= 3072:
                    findings.append(schemas.TLSFindingSchema(
                        finding_id="TLS_STRONG_RSA_KEY",
                        category="cryptographic_strength",
                        title="Strong RSA Key Size",
                        description=f"Certificate uses a robust {cert_info.public_key_size}-bit RSA key.",
                        severity="Informational",
                        evidence={"key_size": cert_info.public_key_size},
                        confidence=1.0
                    ))
            elif cert_info.public_key_algorithm == "ECDSA":
                findings.append(schemas.TLSFindingSchema(
                    finding_id="TLS_ELLIPTIC_CURVE_KEY",
                    category="cryptographic_strength",
                    title="Modern Elliptic Curve Key",
                    description=f"Certificate uses modern Elliptic Curve cryptography ({cert_info.curve or 'ECDSA'} {cert_info.public_key_size}-bit).",
                    severity="Informational",
                    evidence={"curve": cert_info.curve, "key_size": cert_info.public_key_size},
                    confidence=1.0
                ))

            if "sha1" in cert_info.signature_algorithm.lower() or "md5" in cert_info.signature_algorithm.lower():
                crypto_strength = "INSECURE"
                findings.append(schemas.TLSFindingSchema(
                    finding_id="TLS_WEAK_SIGNATURE_HASH",
                    category="cryptographic_strength",
                    title="Insecure Signature Algorithm",
                    description=f"Certificate was signed using {cert_info.signature_algorithm}, which is susceptible to collision attacks.",
                    severity="High",
                    evidence={"signature_algorithm": cert_info.signature_algorithm},
                    recommendation="Upgrade certificate to SHA-256 or stronger signature hash.",
                    confidence=1.0
                ))
                recommendations.append("Certificate signature hash is obsolete (SHA-1/MD5).")

        # 8. Certificate Transparency Query (crt.sh)
        extracted = self.extractor(hostname)
        top_domain = getattr(extracted, "top_domain_under_public_suffix", "")
        registered_domain = top_domain if top_domain else hostname
        ct_result = await self._query_crt_sh(registered_domain)

        if ct_result.status == "COMPLETED" and ct_result.total_records > 0:
            findings.append(schemas.TLSFindingSchema(
                finding_id="TLS_CT_LOGS_FOUND",
                category="certificate_transparency",
                title="Certificate Transparency Records Available",
                description=f"Found {ct_result.total_records} historical Certificate Transparency records across issuers: {', '.join(ct_result.distinct_issuers[:3])}.",
                severity="Informational",
                evidence={
                    "total_records": ct_result.total_records,
                    "issuers": ct_result.distinct_issuers,
                    "recent_count": ct_result.recent_certificates_count
                },
                confidence=1.0
            ))

        return schemas.TLSAnalysisResponse(
            target=target,
            hostname=hostname,
            port=port,
            https_available=True,
            tls_version=handshake_data.get("tls_version"),
            cipher_suite=handshake_data.get("cipher_suite"),
            certificate_status=cert_status,
            hostname_match=hostname_match,
            chain_status=chain_status,
            certificate_info=cert_info,
            cryptographic_strength=crypto_strength,
            certificate_transparency=ct_result,
            findings=findings,
            recommendations=recommendations,
            error_message=None
        )
