import json
from web3 import Web3
from typing import Dict, Any, Tuple
from django.conf import settings

class CredentialRegistryService:
    def __init__(self):
        # We assume settings contains RPC_URL, CREDENTIAL_CONTRACT_ADDRESS, WALLET_PRIVATE_KEY
        self.w3 = Web3(Web3.HTTPProvider(getattr(settings, "POLYGON_RPC_URL", "http://localhost:8545")))
        self.contract_address = getattr(settings, "CREDENTIAL_CONTRACT_ADDRESS", None)
        self.private_key = getattr(settings, "WALLET_PRIVATE_KEY", None)
        self.account = self.w3.eth.account.from_key(self.private_key) if self.private_key else None
        
        # We need the ABI for DocumentCredentialRegistry
        # For simplicity, we just include the ABI of the functions we need
        self.abi = json.loads('''[
            {
                "inputs": [{"internalType": "bytes32", "name": "credentialId", "type": "bytes32"}, {"internalType": "bytes32", "name": "documentHash", "type": "bytes32"}, {"internalType": "uint256", "name": "expiresAt", "type": "uint256"}, {"internalType": "string", "name": "documentType", "type": "string"}],
                "name": "registerCredential",
                "outputs": [],
                "stateMutability": "nonpayable",
                "type": "function"
            },
            {
                "inputs": [{"internalType": "bytes32", "name": "credentialId", "type": "bytes32"}],
                "name": "verifyCredential",
                "outputs": [{"internalType": "bool", "name": "isValid", "type": "bool"}, {"components": [{"internalType": "bytes32", "name": "documentHash", "type": "bytes32"}, {"internalType": "address", "name": "issuer", "type": "address"}, {"internalType": "uint256", "name": "issuedAt", "type": "uint256"}, {"internalType": "uint256", "name": "expiresAt", "type": "uint256"}, {"internalType": "bool", "name": "revoked", "type": "bool"}, {"internalType": "string", "name": "documentType", "type": "string"}], "internalType": "struct DocumentCredentialRegistry.Credential", "name": "credential", "type": "tuple"}],
                "stateMutability": "view",
                "type": "function"
            },
            {
                "inputs": [{"internalType": "bytes32", "name": "credentialId", "type": "bytes32"}],
                "name": "revokeCredential",
                "outputs": [],
                "stateMutability": "nonpayable",
                "type": "function"
            }
        ]''')
        
        if self.contract_address:
            self.contract = self.w3.eth.contract(address=self.contract_address, abi=self.abi)
            
    def issue_credential(self, credential_id: str, document_hash: str, expires_at: int, document_type: str) -> str:
        """Issue a new credential on the blockchain"""
        if not self.account or not self.contract_address:
            raise ValueError("Blockchain not configured properly")
            
        cred_id_bytes = Web3.keccak(text=credential_id)
        doc_hash_bytes = Web3.keccak(text=document_hash)
        
        tx = self.contract.functions.registerCredential(
            cred_id_bytes, 
            doc_hash_bytes, 
            expires_at, 
            document_type
        ).build_transaction({
            'from': self.account.address,
            'nonce': self.w3.eth.get_transaction_count(self.account.address),
            'gas': 2000000,
            'gasPrice': self.w3.eth.gas_price
        })
        
        signed_tx = self.w3.eth.account.sign_transaction(tx, private_key=self.private_key)
        tx_hash = self.w3.eth.send_raw_transaction(signed_tx.raw_transaction)
        
        return self.w3.to_hex(tx_hash)
        
    def verify_credential(self, credential_id: str) -> Tuple[bool, Dict[str, Any]]:
        """Verify a credential exists on the blockchain and is valid"""
        if not self.contract_address:
            raise ValueError("Blockchain not configured properly")
            
        cred_id_bytes = Web3.keccak(text=credential_id)
        is_valid, credential_tuple = self.contract.functions.verifyCredential(cred_id_bytes).call()
        
        credential = {
            "documentHash": self.w3.to_hex(credential_tuple[0]),
            "issuer": credential_tuple[1],
            "issuedAt": credential_tuple[2],
            "expiresAt": credential_tuple[3],
            "revoked": credential_tuple[4],
            "documentType": credential_tuple[5]
        }
        
        return is_valid, credential
        
    def revoke_credential(self, credential_id: str) -> str:
        """Revoke a credential on the blockchain"""
        if not self.account or not self.contract_address:
            raise ValueError("Blockchain not configured properly")
            
        cred_id_bytes = Web3.keccak(text=credential_id)
        
        tx = self.contract.functions.revokeCredential(cred_id_bytes).build_transaction({
            'from': self.account.address,
            'nonce': self.w3.eth.get_transaction_count(self.account.address),
            'gas': 1000000,
            'gasPrice': self.w3.eth.gas_price
        })
        
        signed_tx = self.w3.eth.account.sign_transaction(tx, private_key=self.private_key)
        tx_hash = self.w3.eth.send_raw_transaction(signed_tx.raw_transaction)
        
        return self.w3.to_hex(tx_hash)
