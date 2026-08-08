// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

contract EligibilityRegistry {
    event HashStored(bytes32 indexed hash, address indexed sender, uint256 timestamp);
    
    mapping(bytes32 => bool) public stored;
    
    function storeHash(bytes32 hash) external {
        stored[hash] = true;
        emit HashStored(hash, msg.sender, block.timestamp);
    }
    
    function verify(bytes32 hash) external view returns (bool) {
        return stored[hash];
    }
}
