// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/access/Ownable.sol";

/**
 * @title EligibilityRegistry
 * @notice Stores tamper-proof SHA-256 hashes of ENTITLE eligibility results on Polygon Amoy.
 *         Zero PII is stored on-chain — only the hash and a certificate reference.
 * @dev Only the contract owner (the ENTITLE backend wallet) can call storeHash().
 *      Anyone can call verify() to confirm authenticity.
 */
contract EligibilityRegistry is Ownable {

    // ── Events ───────────────────────────────────────────────────────────────

    event HashStored(
        bytes32 indexed eligibilityHash,
        string  indexed certificateId,
        address         storedBy,
        uint256         timestamp
    );

    // ── Storage ───────────────────────────────────────────────────────────────

    /// @notice Maps a hash → timestamp when it was stored (0 = not stored)
    mapping(bytes32 => uint256) public storedAt;

    /// @notice Maps a hash → certificate ID string for audit trail
    mapping(bytes32 => string) public certificateIds;

    // ── Constructor ───────────────────────────────────────────────────────────

    constructor(address initialOwner) Ownable(initialOwner) {}

    // ── Write (owner only) ────────────────────────────────────────────────────

    /**
     * @notice Stores the SHA-256 hash of an eligibility result.
     * @param eligibilityHash  bytes32 keccak/sha256 hash of the canonical eligibility JSON
     * @param certificateId    Off-chain certificate reference string (e.g. "CERT-42")
     */
    function storeHash(
        bytes32 eligibilityHash,
        string calldata certificateId
    ) external onlyOwner {
        require(storedAt[eligibilityHash] == 0, "EligibilityRegistry: hash already stored");
        storedAt[eligibilityHash] = block.timestamp;
        certificateIds[eligibilityHash] = certificateId;
        emit HashStored(eligibilityHash, certificateId, msg.sender, block.timestamp);
    }

    // ── Read (public) ─────────────────────────────────────────────────────────

    /**
     * @notice Verifies whether a hash was recorded on-chain.
     * @param eligibilityHash  The hash to check
     * @return exists          True if the hash was stored
     * @return timestamp       Block timestamp when it was stored (0 if not found)
     */
    function verify(bytes32 eligibilityHash)
        external
        view
        returns (bool exists, uint256 timestamp)
    {
        uint256 ts = storedAt[eligibilityHash];
        return (ts != 0, ts);
    }
}
