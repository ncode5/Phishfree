import json
import logging
import os
from typing import List, Dict, Any

logger = logging.getLogger(__name__)

_DIR = os.path.dirname(os.path.abspath(__file__))
_PRIMARY_ABI_PATH = os.path.join(_DIR, "ThreatReportRegistry_ABI.json")
_DEPLOYMENT_PATH = os.path.join(_DIR, "contract_deployment.json")


def load_registry_abi() -> List[Dict[str, Any]]:
    """
    Loads and validates the ThreatReportRegistry smart contract ABI.

    Order of precedence:
    1. ThreatReportRegistry_ABI.json (standalone ABI artifact)
    2. contract_deployment.json (Hardhat deployment artifact containing 'abi' field)

    Returns a validated list of ABI item definitions, or an empty list if none found/valid.
    """
    # 1. Try primary standalone ABI file
    if os.path.exists(_PRIMARY_ABI_PATH):
        try:
            with open(_PRIMARY_ABI_PATH, "r", encoding="utf-8") as f:
                data = json.load(f)
                if isinstance(data, list) and len(data) > 0:
                    return data
        except Exception as e:
            logger.warning(f"Failed to load ABI from primary file {_PRIMARY_ABI_PATH}: {e}")

    # 2. Fallback to contract_deployment.json
    if os.path.exists(_DEPLOYMENT_PATH):
        try:
            with open(_DEPLOYMENT_PATH, "r", encoding="utf-8") as f:
                data = json.load(f)
                abi = data.get("abi")
                if isinstance(abi, list) and len(abi) > 0:
                    return abi
        except Exception as e:
            logger.warning(f"Failed to load ABI from deployment file {_DEPLOYMENT_PATH}: {e}")

    logger.error("No valid ThreatReportRegistry ABI found in primary or deployment paths.")
    return []


REGISTRY_ABI: List[Dict[str, Any]] = load_registry_abi()
