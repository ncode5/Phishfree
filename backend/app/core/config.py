import os
from typing import List
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    """Application settings loaded from environment or .env file."""
    model_config = SettingsConfigDict(
        env_file=".env",
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
    PRIVATE_KEY: str = ""
    CONTRACT_ADDRESS: str = ""

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
    def is_serverless(self) -> bool:
        return bool(os.getenv("VERCEL") or os.getenv("AWS_LAMBDA_FUNCTION_NAME"))


settings = Settings()
