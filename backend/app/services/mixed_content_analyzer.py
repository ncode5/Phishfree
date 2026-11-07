import re
from typing import List, Dict, Any, Tuple
from app.database import schemas


class MixedContentAnalyzer:
    """Inspects HTML source code on HTTPS websites to identify insecure HTTP resource inclusions."""

    MAX_HTML_LENGTH = 1_048_576  # Max 1MB parsed to avoid resource exhaustion

    def analyze(
        self,
        html_content: str,
        is_https: bool = True
    ) -> Tuple[float, List[schemas.SecurityFindingSchema], Dict[str, Any]]:
        """Parses HTML for insecure HTTP resource tags and calculates mixed content security score."""
        findings: List[schemas.SecurityFindingSchema] = []

        if not is_https:
            # If site itself is HTTP, mixed content concept doesn't apply directly
            findings.append(
                schemas.SecurityFindingSchema(
                    category="MIXED_CONTENT",
                    title="Website Does Not Use HTTPS Transport",
                    description="The main document is delivered over unencrypted HTTP. All inline assets and user interactions are vulnerable to network interception.",
                    evidence={"protocol": "http"},
                    severity="High",
                    confidence=1.0,
                    recommendation="Migrate the website entirely to HTTPS with automatic redirects."
                )
            )
            return 30.0, findings, {"status": "HTTP_ONLY", "active_count": 0, "passive_count": 0}

        if not html_content:
            return 100.0, [], {"status": "NO_HTML", "active_count": 0, "passive_count": 0}

        # Truncate to limit parsing complexity
        body = html_content[: self.MAX_HTML_LENGTH]

        active_scripts = re.findall(r'<script\b[^>]*\bsrc=["\'](http://[^"\']+)["\']', body, re.IGNORECASE)
        active_stylesheets = re.findall(r'<link\b[^>]*\brel=["\']stylesheet["\'][^>]*\bhref=["\'](http://[^"\']+)["\']', body, re.IGNORECASE)
        # Also check reversed rel/href
        active_stylesheets += re.findall(r'<link\b[^>]*\bhref=["\'](http://[^"\']+)["\'][^>]*\brel=["\']stylesheet["\']', body, re.IGNORECASE)
        active_iframes = re.findall(r'<iframe\b[^>]*\bsrc=["\'](http://[^"\']+)["\']', body, re.IGNORECASE)
        active_forms = re.findall(r'<form\b[^>]*\baction=["\'](http://[^"\']+)["\']', body, re.IGNORECASE)

        passive_images = re.findall(r'<img\b[^>]*\bsrc=["\'](http://[^"\']+)["\']', body, re.IGNORECASE)
        passive_audio = re.findall(r'<audio\b[^>]*\bsrc=["\'](http://[^"\']+)["\']', body, re.IGNORECASE)
        passive_video = re.findall(r'<video\b[^>]*\bsrc=["\'](http://[^"\']+)["\']', body, re.IGNORECASE)

        total_active = len(active_scripts) + len(active_stylesheets) + len(active_iframes) + len(active_forms)
        total_passive = len(passive_images) + len(passive_audio) + len(passive_video)

        score = 100.0

        # 1. Active Mixed Content (Scripts, Iframes, Stylesheets)
        if active_scripts:
            score -= min(40.0, len(active_scripts) * 20.0)
            findings.append(
                schemas.SecurityFindingSchema(
                    category="MIXED_CONTENT",
                    title=f"Active Mixed Content: Insecure HTTP Script(s) ({len(active_scripts)})",
                    description=(
                        f"Found {len(active_scripts)} script reference(s) loaded over plain HTTP on an HTTPS page. "
                        "A network attacker (MitM) can modify this script to execute arbitrary malicious code or steal credentials."
                    ),
                    evidence={"sample_scripts": active_scripts[:5], "total": len(active_scripts)},
                    severity="High",
                    confidence=1.0,
                    recommendation="Change script sources to use 'https://' or relative protocol paths."
                )
            )

        if active_forms:
            score -= min(30.0, len(active_forms) * 25.0)
            findings.append(
                schemas.SecurityFindingSchema(
                    category="MIXED_CONTENT",
                    title="Insecure Form Action Target (HTTP)",
                    description="A form on this HTTPS page submits data to an unencrypted HTTP destination, transmitting form fields in cleartext.",
                    evidence={"sample_form_actions": active_forms[:3]},
                    severity="High",
                    confidence=1.0,
                    recommendation="Ensure all <form action='...'> destinations use HTTPS."
                )
            )

        if active_stylesheets or active_iframes:
            score -= min(25.0, (len(active_stylesheets) + len(active_iframes)) * 10.0)
            findings.append(
                schemas.SecurityFindingSchema(
                    category="MIXED_CONTENT",
                    title=f"Active Mixed Content: Stylesheets or Iframes ({len(active_stylesheets) + len(active_iframes)})",
                    description="Insecurely loaded stylesheets or iframes allow attackers to alter the visual layout or phish embedded views.",
                    evidence={
                        "sample_stylesheets": active_stylesheets[:3],
                        "sample_iframes": active_iframes[:3]
                    },
                    severity="Medium",
                    confidence=1.0,
                    recommendation="Serve all stylesheets and embedded iframes over HTTPS."
                )
            )

        # 2. Passive Mixed Content (Images, Audio, Video)
        if total_passive > 0:
            score -= min(20.0, total_passive * 3.0)
            findings.append(
                schemas.SecurityFindingSchema(
                    category="MIXED_CONTENT",
                    title=f"Passive Mixed Content: Insecure Images/Media ({total_passive})",
                    description=(
                        f"Observed {total_passive} media asset(s) loaded over plain HTTP. "
                        "While not directly executing code, attackers can swap images or track user browsing behavior."
                    ),
                    evidence={"sample_images": passive_images[:5], "total": total_passive},
                    severity="Low",
                    confidence=0.95,
                    recommendation="Update media URLs to HTTPS to prevent mixed-content warnings in modern browsers."
                )
            )

        final_score = round(max(0.0, min(100.0, score)), 1)
        details = {
            "status": "COMPLETED",
            "active_count": total_active,
            "passive_count": total_passive,
            "active_scripts_count": len(active_scripts),
            "passive_images_count": len(passive_images)
        }

        return final_score, findings, details

