// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "./FestivalToken.sol";

/**
 * @title FestivalVault
 * @dev Vault contract that manages USDT escrow and Festival Token minting/burning
 * Maintains 1:1 backing ratio between escrowed USDT and circulating tokens
 */
contract FestivalVault is Ownable {
    using SafeERC20 for IERC20;

    /// @notice USDT token contract (6 decimals)
    IERC20 public immutable usdt;
    
    /// @notice Festival token contract (18 decimals)
    FestivalToken public immutable token;
    
    /// @notice Festival start timestamp
    uint256 public immutable festivalStart;
    
    /// @notice Festival end timestamp
    uint256 public immutable festivalEnd;
    
    /// @notice Whether redemption is currently open
    bool public redemptionOpen;
    
    /// @notice Mapping of user address to their escrowed USDT amount
    mapping(address => uint256) public escrowedUSDT;

    /// @notice Decimal conversion factor (USDT 6 decimals -> Token 18 decimals)
    uint256 private constant DECIMAL_FACTOR = 1e12;

    // Custom errors
    error InvalidAmount();
    error RedemptionNotOpen();
    error InsufficientBalance();
    error TransferFailed();

    // Events
    event Deposited(address indexed user, uint256 usdtAmount, uint256 tokenAmount);
    event Withdrawn(address indexed user, uint256 tokenAmount, uint256 usdtAmount);
    event RedemptionStatusChanged(bool open);

    /**
     * @dev Constructor
     * @param _usdt USDT token address
     * @param _token Festival token address
     * @param _start Festival start timestamp
     * @param _end Festival end timestamp
     * @param _owner Vault owner address
     */
    constructor(
        address _usdt,
        address _token,
        uint256 _start,
        uint256 _end,
        address _owner
    ) Ownable(_owner) {
        usdt = IERC20(_usdt);
        token = FestivalToken(_token);
        festivalStart = _start;
        festivalEnd = _end;
        redemptionOpen = false;
    }

    /**
     * @dev Deposit USDT and receive Festival Tokens at 1:1 ratio
     * @param usdtAmount Amount of USDT to deposit (6 decimals)
     */
    function deposit(uint256 usdtAmount) external {
        if (usdtAmount == 0) revert InvalidAmount();

        // Transfer USDT from user to vault
        usdt.safeTransferFrom(msg.sender, address(this), usdtAmount);

        // Calculate token amount (convert 6 decimals to 18 decimals)
        uint256 tokenAmount = usdtAmount * DECIMAL_FACTOR;

        // Update escrowed balance
        escrowedUSDT[msg.sender] += usdtAmount;

        // Mint festival tokens to user
        token.mint(msg.sender, tokenAmount);

        emit Deposited(msg.sender, usdtAmount, tokenAmount);
    }

    /**
     * @dev Withdraw USDT by burning Festival Tokens
     * @param tokenAmount Amount of tokens to burn (18 decimals)
     */
    function withdraw(uint256 tokenAmount) external {
        if (tokenAmount == 0) revert InvalidAmount();
        
        // Check if redemption is allowed
        if (!redemptionOpen && block.timestamp < festivalEnd) {
            revert RedemptionNotOpen();
        }

        // Calculate USDT amount (convert 18 decimals to 6 decimals)
        uint256 usdtAmount = tokenAmount / DECIMAL_FACTOR;

        // Check user has sufficient escrowed balance
        if (escrowedUSDT[msg.sender] < usdtAmount) {
            revert InsufficientBalance();
        }

        // Update escrowed balance
        escrowedUSDT[msg.sender] -= usdtAmount;

        // Burn festival tokens from user
        token.burn(msg.sender, tokenAmount);

        // Transfer USDT to user
        usdt.safeTransfer(msg.sender, usdtAmount);

        emit Withdrawn(msg.sender, tokenAmount, usdtAmount);
    }

    /**
     * @dev Set redemption status (only owner)
     * @param open Whether redemption should be open
     */
    function setRedemptionOpen(bool open) external onlyOwner {
        redemptionOpen = open;
        emit RedemptionStatusChanged(open);
    }
}
