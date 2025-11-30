// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

/**
 * @title TestUSDT
 * @dev Test USDT token for Sepolia testnet
 * 6 decimals to match real USDT
 */
contract TestUSDT is ERC20, Ownable {
    uint8 private constant _decimals = 6;

    constructor() ERC20("Test USDT", "USDT") Ownable(msg.sender) {
        // Mint 1,000,000 USDT to deployer
        _mint(msg.sender, 1_000_000 * 10 ** _decimals);
    }

    function decimals() public pure override returns (uint8) {
        return _decimals;
    }

    /**
     * @dev Faucet function to mint test tokens
     * @param to Address to receive tokens
     * @param amount Amount to mint (in base units, 6 decimals)
     */
    function faucet(address to, uint256 amount) external onlyOwner {
        _mint(to, amount);
    }
}
