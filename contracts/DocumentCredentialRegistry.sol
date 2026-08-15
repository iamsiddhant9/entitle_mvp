// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/access/Ownable.sol";

/**
 * @title DocumentCredentialRegistry
 * @notice Multi-issuer, revocable document credentials for citizen verification.
 */
contract DocumentCredentialRegistry is Ownable {

    struct Credential {
        bytes32 documentHash;
        address issuer;
        uint256 issuedAt;
        uint256 expiresAt;
        bool revoked;
        string documentType;
    }

    // ── Events ───────────────────────────────────────────────────────────────

    event CredentialRegistered(bytes32 indexed credentialId, address indexed issuer, string documentType, uint256 issuedAt);
    event CredentialRevoked(bytes32 indexed credentialId, address indexed issuer);
    event IssuerAdded(address indexed issuer);
    event IssuerRemoved(address indexed issuer);

    // ── Storage ───────────────────────────────────────────────────────────────

    mapping(bytes32 => Credential) public credentials;
    mapping(address => bool) public authorizedIssuers;

    // ── Constructor ───────────────────────────────────────────────────────────

    constructor(address initialOwner) Ownable(initialOwner) {}

    // ── Modifiers ─────────────────────────────────────────────────────────────

    modifier onlyAuthorizedIssuer() {
        require(authorizedIssuers[msg.sender], "DocumentCredentialRegistry: unauthorized issuer");
        _;
    }

    // ── Write ─────────────────────────────────────────────────────────────────

    function addAuthorizedIssuer(address issuer) external onlyOwner {
        authorizedIssuers[issuer] = true;
        emit IssuerAdded(issuer);
    }

    function removeAuthorizedIssuer(address issuer) external onlyOwner {
        authorizedIssuers[issuer] = false;
        emit IssuerRemoved(issuer);
    }

    function registerCredential(
        bytes32 credentialId,
        bytes32 documentHash,
        uint256 expiresAt,
        string calldata documentType
    ) external onlyAuthorizedIssuer {
        require(credentials[credentialId].issuedAt == 0, "DocumentCredentialRegistry: credential already registered");
        
        credentials[credentialId] = Credential({
            documentHash: documentHash,
            issuer: msg.sender,
            issuedAt: block.timestamp,
            expiresAt: expiresAt,
            revoked: false,
            documentType: documentType
        });
        
        emit CredentialRegistered(credentialId, msg.sender, documentType, block.timestamp);
    }

    function revokeCredential(bytes32 credentialId) external onlyAuthorizedIssuer {
        require(credentials[credentialId].issuedAt != 0, "DocumentCredentialRegistry: credential not found");
        require(credentials[credentialId].issuer == msg.sender, "DocumentCredentialRegistry: not the issuer");
        require(!credentials[credentialId].revoked, "DocumentCredentialRegistry: already revoked");
        
        credentials[credentialId].revoked = true;
        emit CredentialRevoked(credentialId, msg.sender);
    }

    // ── Read ──────────────────────────────────────────────────────────────────

    function verifyCredential(bytes32 credentialId) external view returns (bool isValid, Credential memory credential) {
        credential = credentials[credentialId];
        isValid = credential.issuedAt != 0 && !credential.revoked && (credential.expiresAt == 0 || credential.expiresAt > block.timestamp);
        return (isValid, credential);
    }
}
