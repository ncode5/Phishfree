from abc import ABC, abstractmethod
from typing import Dict, Any


class ThreatIntelProvider(ABC):
    """Abstract interface for external threat intelligence providers."""

    @property
    @abstractmethod
    def name(self) -> str:
        """Provider name."""
        pass

    @abstractmethod
    async def analyze_url(self, url: str) -> Dict[str, Any]:
        """Queries external threat intelligence for a URL."""
        pass

