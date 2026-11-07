import difflib
import idna
import re
from dataclasses import dataclass, field
from datetime import datetime, timezone
from typing import List, Dict, Any, Optional
import tldextract


# List of high-value target brands frequently impersonated in phishing attacks
TARGET_BRANDS: Dict[str, List[str]] = {
    "paypal": ["paypal.com"],
    "apple": ["apple.com", "icloud.com"],
    "google": ["google.com", "gmail.com", "accounts.google.com"],
    "microsoft": ["microsoft.com", "live.com", "office.com", "outlook.com"],
    "amazon": ["amazon.com", "amazon.co.uk", "amazon.de"],
    "netflix": ["netflix.com"],
    "meta": ["meta.com", "facebook.com", "instagram.com", "whatsapp.com"],
    "binance": ["binance.com"],
    "metamask": ["metamask.io"],
    "coinbase": ["coinbase.com"],
    "chase": ["chase.com"],
    "wellsfargo": ["wellsfargo.com"],
    "bankofamerica": ["bankofamerica.com"],
    "dhl": ["dhl.com"],
    "fedex": ["fedex.com"],
    "usps": ["usps.com"],
    "steam": ["steampowered.com", "steamcommunity.com"],
}

# Suspicious TLDs often correlated with disposable/abused domains in phishing campaigns
SUSPICIOUS_TLDS = {
    "tk", "ml", "ga", "cf", "gq", "top", "xyz", "work", "icu", "click", "buzz", "rest", "cam", "fit"
}

# Homoglyph character mapping (Cyrillic/Greek lookalikes to Latin)
HOMOGLYPH_MAP = {
    'а': 'a', 'с': 'c', 'е': 'e', 'о': 'o', 'р': 'p', 'ѕ': 's', 'х': 'x', 'у': 'y',
    'і': 'i', 'ј': 'j', 'ԁ': 'd', 'ԛ': 'q', 'ԝ': 'w', '0': 'o', '1': 'l', '3': 'e',
    '5': 's', '8': 'b', '9': 'g', 'ν': 'v', 'ο': 'o', 'ρ': 'p', 'τ': 't'
}


@dataclass
class DomainAnalysisResult:
    subdomain: str
    domain: str
    suffix: str
    registered_domain: str
    full_domain: str
    is_punycode: bool
    unicode_domain: Optional[str]
    domain_length: int
    subdomain_count: int
    has_hyphens: bool
    hyphen_count: int
    has_suspicious_tld: bool
    is_brand_impersonation: bool
    target_brand: Optional[str]
    similarity_score: float
    findings: List[Dict[str, Any]] = field(default_factory=list)


class DomainAnalyzer:
    """Performs deep structural, linguistic, and brand-impersonation analysis on a hostname."""

    def __init__(self):
        # Configure tldextract without live fetch to ensure offline/fast deterministic parsing
        self.extractor = tldextract.TLDExtract(cache_dir=None)

    def analyze(self, hostname: str) -> DomainAnalysisResult:
        findings: List[Dict[str, Any]] = []
        cleaned_host = hostname.strip().lower()

        # Extract components
        extracted = self.extractor(cleaned_host)
        subdomain = extracted.subdomain
        domain_name = extracted.domain
        suffix = extracted.suffix
        reg_domain = getattr(extracted, "top_domain_under_public_suffix", None) or getattr(extracted, "registered_domain", None)
        registered_domain = reg_domain or cleaned_host
        full_domain = f"{registered_domain}" if not subdomain else f"{subdomain}.{registered_domain}"

        # 1. Punycode and IDN / Homoglyph Analysis
        is_punycode = False
        unicode_domain = None
        if "xn--" in cleaned_host:
            is_punycode = True
            try:
                unicode_domain = idna.decode(cleaned_host)
                findings.append({
                    "category": "DOMAIN",
                    "indicator": "PUNYCODE_DETECTED",
                    "severity": "MEDIUM",
                    "description": f"Domain utilizes Punycode internationalized encoding ({cleaned_host} -> {unicode_domain}). Punycode is frequently abused in homograph spoofing attacks.",
                    "source": "DomainAnalyzer",
                    "confidence": 0.85,
                    "evidence": {
                        "punycode": cleaned_host,
                        "decoded": unicode_domain
                    }
                })
            except Exception as e:
                findings.append({
                    "category": "DOMAIN",
                    "indicator": "MALFORMED_PUNYCODE",
                    "severity": "HIGH",
                    "description": f"Punycode decoding failed: {str(e)}",
                    "source": "DomainAnalyzer",
                    "confidence": 0.9,
                    "evidence": {"punycode": cleaned_host}
                })

        # Check for mixed script / character lookalike substitutions in ascii representation
        substituted_chars = []
        for char, target in HOMOGLYPH_MAP.items():
            if char in (unicode_domain or ""):
                substituted_chars.append(f"{char}->{target}")
        if substituted_chars:
            findings.append({
                "category": "DOMAIN",
                "indicator": "HOMOGLYPH_SUBSTITUTION",
                "severity": "HIGH",
                "description": f"Detected potential homoglyph character substitutions mimicking Latin letters: {', '.join(substituted_chars[:5])}",
                "source": "DomainAnalyzer",
                "confidence": 0.9,
                "evidence": {"substitutions": substituted_chars}
            })

        # 2. Subdomain Structure Analysis
        subdomain_labels = [s for s in subdomain.split(".") if s]
        subdomain_count = len(subdomain_labels)
        if subdomain_count >= 3:
            findings.append({
                "category": "DOMAIN",
                "indicator": "EXCESSIVE_SUBDOMAINS",
                "severity": "MEDIUM",
                "description": f"Excessive subdomain nesting detected ({subdomain_count} levels). Multi-level subdomains are commonly employed to mimic legitimate brands or bypass reputation filters.",
                "source": "DomainAnalyzer",
                "confidence": 0.75,
                "evidence": {
                    "subdomain_count": subdomain_count,
                    "subdomain": subdomain
                }
            })

        # 3. Domain Length Analysis
        domain_length = len(domain_name)
        if domain_length > 30:
            findings.append({
                "category": "DOMAIN",
                "indicator": "SUSPICIOUS_DOMAIN_LENGTH",
                "severity": "LOW",
                "description": f"Unusually long registered domain name ({domain_length} characters). Long domain names may be dynamically generated (DGA) or designed for keyword stuffing.",
                "source": "DomainAnalyzer",
                "confidence": 0.65,
                "evidence": {
                    "domain_length": domain_length,
                    "domain_name": domain_name
                }
            })

        # 4. Hyphen Pattern Analysis
        hyphen_count = domain_name.count("-")
        has_hyphens = hyphen_count > 0
        if hyphen_count >= 3:
            findings.append({
                "category": "DOMAIN",
                "indicator": "EXCESSIVE_HYPHENS",
                "severity": "MEDIUM",
                "description": f"Domain contains {hyphen_count} hyphens. Excessive hyphens are often used in typosquatting to chain words together (e.g., 'secure-bank-login-update').",
                "source": "DomainAnalyzer",
                "confidence": 0.75,
                "evidence": {"hyphen_count": hyphen_count}
            })
        elif "--" in domain_name and not is_punycode:
            findings.append({
                "category": "DOMAIN",
                "indicator": "CONSECUTIVE_HYPHENS",
                "severity": "LOW",
                "description": "Consecutive hyphens ('--') detected in domain name without valid IDN prefix.",
                "source": "DomainAnalyzer",
                "confidence": 0.7,
                "evidence": {"domain_name": domain_name}
            })

        # 5. Suspicious TLD Correlation
        has_suspicious_tld = suffix in SUSPICIOUS_TLDS
        if has_suspicious_tld:
            findings.append({
                "category": "DOMAIN",
                "indicator": "SUSPICIOUS_TLD",
                "severity": "LOW",
                "description": f"Domain uses a top-level domain (.{suffix}) with statistically higher abuse rates in unsolicited campaigns. (Not malicious on its own).",
                "source": "DomainAnalyzer",
                "confidence": 0.5,
                "evidence": {"tld": suffix}
            })

        # 6. Typosquatting and Brand Impersonation Analysis
        is_brand_impersonation = False
        target_brand_found: Optional[str] = None
        max_similarity = 0.0

        # Normalized string without hyphens/numbers for fuzzy matching
        clean_name = re.sub(r"[^a-z]", "", domain_name)

        for brand, official_domains in TARGET_BRANDS.items():
            # If this is actually the official brand domain, do not flag!
            if registered_domain in official_domains:
                continue

            # Check if brand keyword is embedded in the domain or subdomains
            brand_in_domain = brand in domain_name
            brand_in_subdomain = brand in subdomain

            if brand_in_domain or brand_in_subdomain:
                is_brand_impersonation = True
                target_brand_found = brand
                max_similarity = 1.0
                findings.append({
                    "category": "BRAND_PROTECTION",
                    "indicator": "BRAND_IMPERSONATION_KEYWORD",
                    "severity": "HIGH",
                    "description": f"Domain or subdomain explicitly includes target brand keyword '{brand.upper()}', yet the registered domain ({registered_domain}) is not an authorized official domain.",
                    "source": "DomainAnalyzer",
                    "confidence": 0.95,
                    "evidence": {
                        "target_brand": brand,
                        "matched_in": "domain" if brand_in_domain else "subdomain",
                        "registered_domain": registered_domain,
                        "official_domains": official_domains
                    }
                })
                break

            # Check fuzzy distance (e.g., paypa1, micros0ft, app1e)
            similarity = difflib.SequenceMatcher(None, clean_name, brand).ratio()
            # If similarity is high (e.g. >= 0.8) and length difference is small (1 or 2 chars), it's a lookalike typosquat
            if similarity >= 0.8 and abs(len(clean_name) - len(brand)) <= 2:
                if similarity > max_similarity:
                    max_similarity = similarity
                    target_brand_found = brand
                    is_brand_impersonation = True

        if is_brand_impersonation and target_brand_found and max_similarity < 1.0:
            findings.append({
                "category": "BRAND_PROTECTION",
                "indicator": "TYPOSQUATTING_SUSPECTED",
                "severity": "HIGH",
                "description": f"Domain name '{domain_name}' closely resembles well-known brand '{target_brand_found.upper()}' (similarity ratio: {max_similarity:.2f}), suggesting intentional typosquatting.",
                "source": "DomainAnalyzer",
                "confidence": 0.9,
                "evidence": {
                    "target_brand": target_brand_found,
                    "similarity": round(max_similarity, 3),
                    "domain_name": domain_name
                }
            })

        return DomainAnalysisResult(
            subdomain=subdomain,
            domain=domain_name,
            suffix=suffix,
            registered_domain=registered_domain,
            full_domain=full_domain,
            is_punycode=is_punycode,
            unicode_domain=unicode_domain,
            domain_length=domain_length,
            subdomain_count=subdomain_count,
            has_hyphens=has_hyphens,
            hyphen_count=hyphen_count,
            has_suspicious_tld=has_suspicious_tld,
            is_brand_impersonation=is_brand_impersonation,
            target_brand=target_brand_found,
            similarity_score=max_similarity,
            findings=findings
        )
