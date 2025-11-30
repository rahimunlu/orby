// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "./FestivalToken.sol";
import "./FestivalVault.sol";

/**
 * @title FestivalFactory
 * @dev Factory contract that deploys paired FestivalToken and FestivalVault contracts
 */
contract FestivalFactory {
    /// @notice USDT token address used for all festivals
    address public immutable usdt;

    /// @notice Emitted when a new festival is created
    event FestivalCreated(
        address indexed token,
        address indexed vault,
        string name,
        string symbol
    );

    /**
     * @dev Constructor
     * @param _usdt USDT token address
     */
    constructor(address _usdt) {
        usdt = _usdt;
    }

    /**
     * @dev Creates a new festival with token and vault contracts
     * @param name Token name
     * @param symbol Token symbol
     * @param startTime Festival start timestamp
     * @param endTime Festival end timestamp
     * @return token Address of deployed FestivalToken
     * @return vault Address of deployed FestivalVault
     */
    function createFestival(
        string calldata name,
        string calldata symbol,
        uint256 startTime,
        uint256 endTime
    ) external returns (address token, address vault) {
        // Deploy FestivalToken with factory as initial owner (so we can transfer to vault)
        FestivalToken festivalToken = new FestivalToken(name, symbol, address(this));
        token = address(festivalToken);

        // Deploy FestivalVault with msg.sender as owner
        FestivalVault festivalVault = new FestivalVault(
            usdt,
            token,
            startTime,
            endTime,
            msg.sender
        );
        vault = address(festivalVault);

        // Transfer token ownership to vault so it can mint/burn
        festivalToken.transferOwnership(vault);

        emit FestivalCreated(token, vault, name, symbol);
    }
}
