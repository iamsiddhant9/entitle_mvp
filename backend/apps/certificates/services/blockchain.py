"""
Polygon Amoy anchoring via the EligibilityRegistry contract
(contracts/EligibilityRegistry.sol).

Only the 32-byte certificate hash ever goes on-chain — zero PII.

If the wallet key / contract address are not configured (or web3 is not
installed), the service runs in *simulated* mode: it returns a deterministic
pseudo transaction hash and marks the certificate `chain_status=simulated`,
so the whole product flow works offline. Configure WALLET_PRIVATE_KEY and
ELIGIBILITY_REGISTRY_ADDRESS to go live.
"""
import hashlib
import logging

from django.conf import settings

logger = logging.getLogger(__name__)

REGISTRY_ABI = [
    {
        "inputs": [{"internalType": "bytes32", "name": "hash", "type": "bytes32"}],
        "name": "storeHash",
        "outputs": [],
        "stateMutability": "nonpayable",
        "type": "function",
    },
    {
        "inputs": [{"internalType": "bytes32", "name": "hash", "type": "bytes32"}],
        "name": "verify",
        "outputs": [{"internalType": "bool", "name": "", "type": "bool"}],
        "stateMutability": "view",
        "type": "function",
    },
]


def is_configured():
    return bool(settings.WALLET_PRIVATE_KEY and settings.ELIGIBILITY_REGISTRY_ADDRESS)


def _web3_and_contract():
    from web3 import Web3

    w3 = Web3(Web3.HTTPProvider(settings.POLYGON_AMOY_RPC_URL, request_kwargs={"timeout": 30}))
    contract = w3.eth.contract(
        address=Web3.to_checksum_address(settings.ELIGIBILITY_REGISTRY_ADDRESS), abi=REGISTRY_ABI
    )
    return w3, contract


def _simulated_tx_hash(hex_hash):
    return "0x" + hashlib.sha256("simulated:{}".format(hex_hash).encode("utf-8")).hexdigest()


def store_hash(hex_hash):
    """
    Store a 0x-prefixed SHA-256 hash on the registry. Returns
    {"tx_hash": str, "chain_status": "simulated" | "submitted" | "failed"}.
    Never raises — certificate issuance must not fail because the chain is down.
    """
    if not is_configured():
        return {"tx_hash": _simulated_tx_hash(hex_hash), "chain_status": "simulated"}

    try:
        w3, contract = _web3_and_contract()
        account = w3.eth.account.from_key(settings.WALLET_PRIVATE_KEY)
        tx = contract.functions.storeHash(bytes.fromhex(hex_hash[2:])).build_transaction(
            {
                "from": account.address,
                "nonce": w3.eth.get_transaction_count(account.address),
                "chainId": settings.POLYGON_CHAIN_ID,
                "gas": 100000,
                "gasPrice": w3.eth.gas_price,
            }
        )
        signed = account.sign_transaction(tx)
        raw = getattr(signed, "raw_transaction", None) or signed.rawTransaction  # web3 v6/v7 naming
        tx_hash = w3.eth.send_raw_transaction(raw)
        return {"tx_hash": tx_hash.hex() if tx_hash.hex().startswith("0x") else "0x" + tx_hash.hex(),
                "chain_status": "submitted"}
    except Exception:
        logger.exception("Polygon Amoy submission failed; certificate issued without anchoring")
        return {"tx_hash": "", "chain_status": "failed"}


def verify_hash(hex_hash):
    """
    True/False from the on-chain registry, or None when the chain is not
    configured/reachable (callers fall back to the local database).
    """
    if not is_configured():
        return None
    try:
        _, contract = _web3_and_contract()
        return bool(contract.functions.verify(bytes.fromhex(hex_hash[2:])).call())
    except Exception:
        logger.exception("Polygon Amoy verification call failed")
        return None
