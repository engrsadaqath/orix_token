// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

/**
 * @title ChatSign
 * @dev Ultra-minimal contract for recording chat signatures with absolute minimal gas consumption
 */
contract ChatSign {
    // Mapping to track which addresses have signed - only essential storage
    mapping(address => bool) public hasSigned;
    
    /**
     * @dev Function to sign for chat access
     * Absolute minimal implementation for lowest possible gas consumption
     * No events, no admin checks, just pure functionality
     */
    function chatSign() external {
        // Single storage operation - absolute minimum required
        hasSigned[msg.sender] = true;
    }
    
    /**
     * @dev Function to check if an address has signed
     * Pure view function - no gas cost when called off-chain
     */
    function checkSignStatus(address user) external view returns (bool) {
        return hasSigned[user];
    }
}