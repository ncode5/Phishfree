import os
import re
from typing import List, Optional
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    """Application settings loaded from environment or .env file."""
    model_config = SettingsConfigDict(
        env_file=(".env", "backend/.env"),
        env_file_encoding="utf-8",
        extra="ignore"
    )

    ENVIRONMENT: str = "development"
    PROJECT_NAME: str = "AI-Powered Web Threat Detection & Digital Trust Intelligence"
    API_V1_PREFIX: str = "/api/v1"

    # Database: Supports hosted PostgreSQL (Neon / Supabase) via DATABASE_URL,
    # with SQLite fallback for offline local testing
    DATABASE_URL: str = "sqlite:///./trust_intel.db"

    # External Threat Intelligence
    VIRUSTOTAL_API_KEY: str = ""

    # AI Explanations
    GEMINI_API_KEY: str = ""
    OPENAI_API_KEY: str = ""

    # Web3 / Blockchain Integration (Sepolia Testnet)
    BLOCKCHAIN_RPC_URL: str = "https://ethereum-sepolia-rpc.publicnode.com"
    SEPOLIA_RPC_URL: str = ""
    SEPOLIA_CHAIN_ID: int = 11155111
    PRIVATE_KEY: str = ""
    BLOCKCHAIN_PRIVATE_KEY: str = ""
    CONTRACT_ADDRESS: str = ""
    THREAT_REGISTRY_CONTRACT_ADDRESS: str = ""

    @property
    def effective_rpc_url(self) -> str:
        return self.BLOCKCHAIN_RPC_URL or self.SEPOLIA_RPC_URL or "https://ethereum-sepolia-rpc.publicnode.com"

    @property
    def effective_private_key(self) -> str:
        return self.BLOCKCHAIN_PRIVATE_KEY or self.PRIVATE_KEY or ""

    @property
    def effective_contract_address(self) -> str:
        addr = self.THREAT_REGISTRY_CONTRACT_ADDRESS or self.CONTRACT_ADDRESS or ""
        if not addr:
            try:
                import json
                dep_path = os.path.join(os.path.dirname(__file__), "..", "web3", "contract_deployment.json")
                if os.path.exists(dep_path):
                    with open(dep_path, "r", encoding="utf-8") as f:
                        data = json.load(f)
                        return data.get("contractAddress", "")
            except Exception:
                pass
        return addr

    # CORS Allowed Origins
    ALLOWED_ORIGINS: str = "http://localhost:5173,http://127.0.0.1:5173,http://localhost:3000,https://*.vercel.app"

    # Configurable Risk Engine Weights
    WEIGHT_THREAT_INTEL_CONFIRMED: int = 50
    WEIGHT_THREAT_INTEL_SUSPICIOUS: int = 25
    WEIGHT_BRAND_IMPERSONATION: int = 20
    WEIGHT_SUSPICIOUS_REDIRECT: int = 15
    WEIGHT_SSRF_PRIVATE_IP: int = 40
    WEIGHT_SUSPICIOUS_URL_STRUCTURE: int = 10
    WEIGHT_SUSPICIOUS_DOMAIN_CHARS: int = 10
    WEIGHT_PUNYCODE_HOMOGLYPH: int = 15

    # Safe network parameters optimized for Vercel Serverless execution limits (<= 10s window)
    REQUEST_TIMEOUT_SECONDS: float = 4.0
    DNS_TIMEOUT_SECONDS: float = 2.0
    REDIRECT_TIMEOUT_SECONDS: float = 3.5
    MAX_REDIRECT_HOPS: int = 5
    MAX_URL_LENGTH: int = 2048

    @property
    def cors_origins(self) -> List[str]:
        return [origin.strip() for origin in self.ALLOWED_ORIGINS.split(",") if origin.strip()]

    @property
    def cors_exact_origins(self) -> List[str]:
        """Returns exact origin strings without wildcard characters."""
        origins = []
        for o in self.ALLOWED_ORIGINS.split(","):
            cleaned = o.strip()
            if cleaned and "*" not in cleaned:
                origins.append(cleaned)
        return origins

    @property
    def cors_origin_regex(self) -> Optional[str]:
        """Builds strict, anchored regular expression for wildcard patterns like https://*.vercel.app."""
        patterns = []
        for o in self.ALLOWED_ORIGINS.split(","):
            cleaned = o.strip()
            if cleaned and "*" in cleaned:
                escaped = re.escape(cleaned).replace(r"\*", r"[a-zA-Z0-9-]+")
                patterns.append(f"^{escaped}$")
        if patterns:
            return "|".join(patterns)
        return None

    @property
    def is_serverless(self) -> bool:
        return bool(os.getenv("VERCEL") or os.getenv("AWS_LAMBDA_FUNCTION_NAME"))


settings = Settings()
