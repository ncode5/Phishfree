import logging
from typing import Dict, Any, Optional, List
from hexbytes import HexBytes
from web3 import Web3
from web3.exceptions import Web3Exception
from app.core.config import settings
from app.web3.contract_abi import REGISTRY_ABI

logger = logging.getLogger(__name__)


class BlockchainService:
    """
    Decentralized Threat Intelligence Service integrating with EVM-compatible
    blockchains (Sepolia Ethereum Testnet) and the ThreatReportRegistry smart contract.
    """

    def __init__(
        self,
        rpc_url: Optional[str] = None,
        contract_address: Optional[str] = None,
        private_key: Optional[str] = None,
        chain_id: Optional[int] = None,
    ):
        self.rpc_url = rpc_url if rpc_url is not None else settings.effective_rpc_url
        self.contract_address_raw = contract_address if contract_address is not None else settings.effective_contract_address
        self.private_key = private_key if private_key is not None else settings.effective_private_key
        self.expected_chain_id = chain_id if chain_id is not None else settings.SEPOLIA_CHAIN_ID
        self.network_name = "Ethereum Sepolia Testnet"

        # Initialize Web3 HTTPProvider with safe timeouts
        self.w3 = Web3(Web3.HTTPProvider(self.rpc_url, request_kwargs={"timeout": 6.0}))

    @property
    def contract_address(self) -> Optional[str]:
        """Returns checksummed contract address if valid, otherwise None."""
        if not self.contract_address_raw:
            return None
        try:
            return self.w3.to_checksum_address(self.contract_address_raw.strip())
        except Exception:
            return None

    def get_contract(self):
        """Returns the Web3 Contract instance if address is configured and valid."""
        addr = self.contract_address
        if not addr or not REGISTRY_ABI:
            return None
        return self.w3.eth.contract(address=addr, abi=REGISTRY_ABI)

    def is_connected(self) -> bool:
        """Checks whether Web3 is connected to the EVM JSON-RPC endpoint."""
        try:
            return self.w3.is_connected()
        except Exception:
            return False

    def get_network_status(self) -> Dict[str, Any]:
        """
        Retrieves real-time operational status of JSON-RPC connection,
        chain ID, wallet balance, and contract deployment state.
        """
        if not self.rpc_url:
            return {
                "network_name": self.network_name,
                "chain_id": self.expected_chain_id,
                "rpc_url": "",
                "rpc_status": "UNCONFIGURED",
                "contract_available": False,
                "message": "No RPC endpoint configured."
            }

        try:
            connected = self.w3.is_connected()
            if not connected:
                return {
                    "network_name": self.network_name,
                    "chain_id": self.expected_chain_id,
                    "rpc_url": self.rpc_url,
                    "rpc_status": "DISCONNECTED",
                    "contract_available": False,
                    "message": "Failed to connect to blockchain RPC node."
                }

            chain_id = self.w3.eth.chain_id
            latest_block = self.w3.eth.block_number

            # Wallet status
            wallet_address = None
            wallet_balance_eth = None
            if self.private_key and len(self.private_key.replace("0x", "")) == 64:
                try:
                    acct = self.w3.eth.account.from_key(self.private_key)
                    wallet_address = acct.address
                    balance_wei = self.w3.eth.get_balance(wallet_address)
                    wallet_balance_eth = float(self.w3.from_wei(balance_wei, "ether"))
                except Exception as e:
                    logger.warning(f"Could not inspect wallet from private key: {e}")

            # Contract verification
            contract = self.get_contract()
            contract_available = False
            total_reports = 0
            recent_registrations: List[Dict[str, Any]] = []

            if contract and self.contract_address:
                try:
                    code = self.w3.eth.get_code(self.contract_address)
                    if code and len(code) > 2:  # non-empty bytecode
                        contract_available = True
                        try:
                            total_reports = contract.functions.getTotalReports().call()
                            if total_reports > 0:
                                recents = contract.functions.getRecentReports(5).call()
                                for r in recents:
                                    recent_registrations.append({
                                        "report_hash": "0x" + HexBytes(r[0]).hex().replace("0x", ""),
                                        "timestamp": r[1],
                                        "submitter": r[2],
                                        "exists": r[3]
                                    })
                        except Exception as ce:
                            logger.info(f"Contract state call notice: {ce}")
                except Exception as e:
                    logger.warning(f"Error inspecting contract at {self.contract_address}: {e}")

            return {
                "network_name": self.network_name,
                "chain_id": chain_id,
                "rpc_url": self.rpc_url,
                "rpc_status": "CONNECTED",
                "latest_block": latest_block,
                "contract_address": self.contract_address,
                "contract_available": contract_available,
                "total_reports_registered": total_reports if contract_available else None,
                "recent_registrations": recent_registrations,
                "wallet_address": wallet_address,
                "wallet_balance_eth": wallet_balance_eth
            }
        except Exception as e:
            logger.error(f"Error checking network status: {e}")
            return {
                "network_name": self.network_name,
                "chain_id": self.expected_chain_id,
                "rpc_url": self.rpc_url,
                "rpc_status": "UNAVAILABLE",
                "contract_available": False,
                "message": f"RPC connection error: {str(e)}"
            }

    def verify_report_on_chain(self, report_hash: str) -> Dict[str, Any]:
        """
        Queries the ThreatReportRegistry smart contract to verify whether
        the given Keccak-256 report hash exists on-chain.
        """
        # Format hash into 32-byte HexBytes
        clean_hash = report_hash.strip().lower()
        if not clean_hash.startswith("0x"):
            clean_hash = "0x" + clean_hash

        if len(clean_hash) != 66:
            return {
                "registered": False,
                "status": "FAILED",
                "error": "Invalid Keccak-256 hash length. Must be 64 hex characters (32 bytes)."
            }

        hash_bytes = HexBytes(clean_hash)

        contract = self.get_contract()
        if not contract or not self.contract_address:
            return {
                "registered": False,
                "status": "UNAVAILABLE",
                "error": "Contract address not configured or unavailable."
            }

        try:
            exists, reg_hash, timestamp, submitter = contract.functions.verifyReport(hash_bytes).call()
            reg_hash_hex = "0x" + HexBytes(reg_hash).hex().replace("0x", "")

            return {
                "registered": bool(exists),
                "status": "VERIFIED" if exists else "NOT_REGISTERED",
                "report_hash": clean_hash,
                "registered_report_hash": reg_hash_hex if exists else None,
                "timestamp": timestamp if exists else None,
                "submitter": submitter if exists else None,
                "network": self.network_name,
                "chain_id": self.expected_chain_id,
                "contract_address": self.contract_address
            }
        except Web3Exception as we:
            logger.error(f"Web3 exception during report verification: {we}")
            return {
                "registered": False,
                "status": "UNAVAILABLE",
                "error": f"Blockchain query failed: {str(we)}"
            }
        except Exception as e:
            logger.error(f"Unexpected error verifying report on-chain: {e}")
            return {
                "registered": False,
                "status": "UNAVAILABLE",
                "error": str(e)
            }

    def register_report_on_chain(self, report_hash: str) -> Dict[str, Any]:
        """
        Signs and broadcasts a transaction to invoke registerReport(bytes32) on-chain.
        
        Enforces:
        - Check of wallet private key presence
        - Check of account ETH balance (gas sufficiency)
        - Check that hash is not already registered
        - Safe gas estimation + buffer
        - Nonce management
        - Transaction confirmation receipt wait
        """
        clean_hash = report_hash.strip().lower()
        if not clean_hash.startswith("0x"):
            clean_hash = "0x" + clean_hash

        if len(clean_hash) != 66:
            return {
                "status": "FAILED",
                "error": "Invalid Keccak-256 hash length. Must be 32 bytes (66 hex characters)."
            }

        if not self.private_key or len(self.private_key.replace("0x", "")) != 64:
            return {
                "status": "FAILED",
                "error": "Wallet private key not configured in backend environment (BLOCKCHAIN_PRIVATE_KEY missing)."
            }

        contract = self.get_contract()
        if not contract or not self.contract_address:
            return {
                "status": "FAILED",
                "error": "Contract address not configured or unavailable on network."
            }

        try:
            account = self.w3.eth.account.from_key(self.private_key)
            sender_address = account.address
            hash_bytes = HexBytes(clean_hash)

            # Check wallet balance
            balance_wei = self.w3.eth.get_balance(sender_address)
            if balance_wei == 0:
                return {
                    "status": "FAILED",
                    "error": (
                        f"Wallet address {sender_address} has 0 ETH on {self.network_name}. "
                        "Gas is required to broadcast an on-chain transaction. "
                        "Please request Sepolia testnet ETH from a public faucet."
                    )
                }

            # Pre-flight chain ID verification: Protect against wrong-network broadcasts
            REQUIRED_SEPOLIA_CHAIN_ID = 11155111
            if self.expected_chain_id != REQUIRED_SEPOLIA_CHAIN_ID:
                return {
                    "status": "FAILED",
                    "error": (
                        f"Configuration error: Expected chain ID is {self.expected_chain_id}, "
                        f"but PhishFree Sepolia integration strictly requires {REQUIRED_SEPOLIA_CHAIN_ID}."
                    )
                }

            try:
                actual_chain_id = self.w3.eth.chain_id
            except Exception as ce:
                return {
                    "status": "FAILED",
                    "error": f"Failed to retrieve network chain ID from RPC endpoint: {ce}"
                }

            if actual_chain_id != self.expected_chain_id:
                logger.error(
                    f"Chain ID mismatch: RPC returned {actual_chain_id}, "
                    f"expected {self.expected_chain_id} (Sepolia: {REQUIRED_SEPOLIA_CHAIN_ID}). Aborting transaction."
                )
                return {
                    "status": "FAILED",
                    "error": (
                        f"Chain ID mismatch: Connected RPC returned Chain ID {actual_chain_id}, "
                        f"but required Chain ID is {self.expected_chain_id} (Ethereum Sepolia). "
                        "Transaction creation aborted."
                    ),
                    "actual_chain_id": actual_chain_id,
                    "expected_chain_id": self.expected_chain_id
                }

            # Pre-flight check: ensure report is not already registered
            try:
                already_exists = contract.functions.isReportRegistered(hash_bytes).call()
                if already_exists:
                    return {
                        "status": "FAILED",
                        "error": "Report hash already registered on-chain. Duplicate registration prohibited."
                    }
            except Exception as pe:
                logger.debug(f"Pre-flight check notice: {pe}")

            # Nonce and gas price
            nonce = self.w3.eth.get_transaction_count(sender_address, "pending")
            gas_price = self.w3.eth.gas_price

            # Build contract function call
            func = contract.functions.registerReport(hash_bytes)

            try:
                estimated_gas = func.estimate_gas({"from": sender_address})
                gas_limit = int(estimated_gas * 1.25)
            except Exception:
                gas_limit = 120000

            # Estimate total cost
            total_gas_cost = gas_limit * gas_price
            if balance_wei < total_gas_cost:
                return {
                    "status": "FAILED",
                    "error": f"Insufficient balance for gas fee. Required: {self.w3.from_wei(total_gas_cost, 'ether')} ETH, Available: {self.w3.from_wei(balance_wei, 'ether')} ETH."
                }

            tx = func.build_transaction({
                "from": sender_address,
                "nonce": nonce,
                "gas": gas_limit,
                "gasPrice": gas_price,
                "chainId": actual_chain_id,
            })

            # Sign transaction
            signed_tx = self.w3.eth.account.sign_transaction(tx, self.private_key)

            # Broadcast
            tx_hash_bytes = self.w3.eth.send_raw_transaction(signed_tx.raw_transaction)
            tx_hash = "0x" + tx_hash_bytes.hex().replace("0x", "")

            # Wait for receipt
            receipt = self.w3.eth.wait_for_transaction_receipt(tx_hash_bytes, timeout=35)

            if receipt.status == 1:
                explorer_url = f"https://sepolia.etherscan.io/tx/{tx_hash}"
                return {
                    "status": "CONFIRMED",
                    "transaction_hash": tx_hash,
                    "block_number": receipt.blockNumber,
                    "submitter_address": sender_address,
                    "contract_address": self.contract_address,
                    "gas_used": receipt.gasUsed,
                    "explorer_url": explorer_url,
                    "message": "Report fingerprint successfully registered on-chain."
                }
            else:
                return {
                    "status": "FAILED",
                    "transaction_hash": tx_hash,
                    "block_number": receipt.blockNumber,
                    "error": "Blockchain transaction reverted by contract."
                }

        except Web3Exception as we:
            logger.error(f"Web3 transaction error: {we}")
            return {
                "status": "FAILED",
                "error": f"Web3 transaction failed: {str(we)}"
            }
        except Exception as e:
            logger.error(f"Error registering report on blockchain: {e}")
            return {
                "status": "FAILED",
                "error": str(e)
            }
