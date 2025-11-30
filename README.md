# Orby - Festival Payment System

Orby is a mobile-first digital wallet application for festival attendees built on Ethereum Sepolia. It implements a **Vault-based Escrow Architecture** where USDT deposits are locked in a smart contract vault while festival-specific ERC20 tokens are minted 1:1.

## 🔐 Powered by Tether WDK

Orby leverages **[Tether Wallet Development Kit (WDK)](https://github.com/AustinFoss/wdk-docs)** for secure, non-custodial wallet management on EVM chains. WDK provides:

- **BIP-39 Mnemonic Generation**: Secure seed phrase creation with `WDK.getRandomSeedPhrase()`
- **HD Wallet Derivation**: Multiple accounts from a single seed using `wdk.getAccount('ethereum', index)`
- **Transaction Signing**: Native transaction signing and broadcasting via `account.sendTransaction()`
- **Multi-Chain Support**: Built-in support for Ethereum and EVM-compatible networks

```typescript
// Client-side: User wallet management
const seedPhrase = WDK.getRandomSeedPhrase();
const wdk = new WDK(seedPhrase).registerWallet('ethereum', WalletManagerEvm, { provider: rpcUrl });
const account = await wdk.getAccount('ethereum', 0);
const address = account.getAddress();

// Server-side: Transaction signing
const { hash } = await account.sendTransaction({ to, value, data });
```

WDK enables Orby to provide a seamless Web2-like experience while maintaining full Web3 security guarantees.

## Architecture Overview

```
┌─────────────────────────────────────────────────────────────────┐
│                     Frontend (Next.js 15)                       │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐        │
│  │  Login   │  │  Wallet  │  │  Admin   │  │    QR    │        │
│  │   Page   │  │   Page   │  │   Page   │  │   Page   │        │
│  └────┬─────┘  └────┬─────┘  └────┬─────┘  └──────────┘        │
│       │             │             │                             │
│       └─────────────┼─────────────┘                             │
│                     ▼                                           │
│        ┌───────────────────────────┐                            │
│        │    🔐 WDK Client          │                            │
│        │  • Seed generation        │                            │
│        │  • Address derivation     │                            │
│        │  • Balance queries        │                            │
│        └───────────────────────────┘                            │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                      API Layer (Next.js)                        │
│  ┌────────────┐  ┌────────────┐  ┌────────────┐                │
│  │  /topup    │  │  /cashout  │  │  /balances │                │
│  └─────┬──────┘  └─────┬──────┘  └─────┬──────┘                │
│        │               │               │                        │
│        └───────────────┼───────────────┘                        │
│                        ▼                                        │
│        ┌───────────────────────────┐                            │
│        │    🔐 WDK Server          │                            │
│        │  • Transaction signing    │                            │
│        │  • Contract interactions  │                            │
│        │  • Multi-account support  │                            │
│        └───────────────────────────┘                            │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                  Ethereum Sepolia (Chain ID: 11155111)          │
│  ┌─────────────────┐  ┌─────────────────┐  ┌─────────────────┐ │
│  │ FestivalFactory │──│  FestivalToken  │──│  FestivalVault  │ │
│  │   (Deployer)    │  │    (ERC20)      │  │    (Escrow)     │ │
│  └─────────────────┘  └─────────────────┘  └─────────────────┘ │
│                                                    │            │
│                                            ┌───────┴───────┐   │
│                                            │  USDT (6 dec) │   │
│                                            └───────────────┘   │
└─────────────────────────────────────────────────────────────────┘
```

## 💡 Self-Backing Vault Architecture

Traditional festival token systems require organizers to:
1. Create a separate **Liquidity Pool** (expensive, complex)
2. Provide initial liquidity (capital intensive)
3. Manage price volatility and impermanent loss
4. Deal with AMM complexity and slippage

**Orby eliminates all of this with a revolutionary Vault-based Escrow design:**

```
┌─────────────────────────────────────────────────────────────────────────┐
│                    VAULT-BASED ESCROW ARCHITECTURE                      │
│                                                                         │
│    ┌─────────────┐         DEPOSIT          ┌─────────────────────┐    │
│    │             │  ───────────────────────▶ │                     │    │
│    │    USER     │        100 USDT          │   FESTIVAL VAULT    │    │
│    │             │  ◀─────────────────────── │                     │    │
│    └─────────────┘     100 Festival Tokens  │  ┌───────────────┐  │    │
│                                              │  │ escrowedUSDT  │  │    │
│                                              │  │   mapping     │  │    │
│    ┌─────────────┐         WITHDRAW         │  └───────────────┘  │    │
│    │             │  ───────────────────────▶ │         │          │    │
│    │    USER     │     100 Festival Tokens  │         ▼          │    │
│    │             │  ◀─────────────────────── │  ┌───────────────┐  │    │
│    └─────────────┘        100 USDT          │  │  USDT Balance  │  │    │
│                                              │  │  (Locked)     │  │    │
│                                              │  └───────────────┘  │    │
│                                              └─────────────────────┘    │
│                                                                         │
│    ┌───────────────────────────────────────────────────────────────┐   │
│    │                     CORE INVARIANT                             │   │
│    │                                                                │   │
│    │   Vault.usdtBalance × 10¹² == FestivalToken.totalSupply       │   │
│    │                                                                │   │
│    │   • Every token is ALWAYS backed 1:1 by locked USDT           │   │
│    │   • No liquidity pool needed                                   │   │
│    │   • No price volatility                                        │   │
│    │   • No impermanent loss                                        │   │
│    │   • Instant, guaranteed redemption                             │   │
│    └───────────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────────────┘
```

### Why This Architecture

| Traditional LP Approach | Orby Vault Approach |
|------------------------|---------------------|
| ❌ Requires initial liquidity | ✅ Zero initial capital needed |
| ❌ Price fluctuates with trades | ✅ Fixed 1:1 exchange rate |
| ❌ Impermanent loss risk | ✅ No IL - tokens are burned, not swapped |
| ❌ Complex AMM mechanics | ✅ Simple deposit/withdraw |
| ❌ Slippage on large trades | ✅ No slippage ever |
| ❌ Arbitrage opportunities | ✅ No arbitrage possible |
| ❌ Requires DEX integration | ✅ Self-contained system |

**The magic**: When users deposit USDT, it's locked in the Vault and tokens are minted. When they withdraw, tokens are burned and USDT is released. The Vault IS the liquidity - no external pool required!

```solidity
// Deposit: Lock USDT, Mint Tokens
function deposit(uint256 usdtAmount) external {
    usdt.transferFrom(msg.sender, address(this), usdtAmount);
    token.mint(msg.sender, usdtAmount * 10**12);  // 6 → 18 decimals
    escrowedUSDT[msg.sender] += usdtAmount;
}

// Withdraw: Burn Tokens, Release USDT
function withdraw(uint256 tokenAmount) external {
    uint256 usdtAmount = tokenAmount / 10**12;    // 18 → 6 decimals
    token.burn(msg.sender, tokenAmount);
    usdt.transfer(msg.sender, usdtAmount);
    escrowedUSDT[msg.sender] -= usdtAmount;
}
```

This design means **any festival organizer can launch their own token economy in minutes** - just deploy through the Factory and they're ready to go. No DeFi expertise required, no liquidity bootstrapping, no ongoing pool management.

### 🔗 Live on Sepolia Testnet

| Contract | Address | Etherscan |
|----------|---------|-----------|
| FestivalFactory | `0x73eA5768CF25b4D9Ee342A364948543E202C2D8d` | [View ↗](https://sepolia.etherscan.io/address/0x73eA5768CF25b4D9Ee342A364948543E202C2D8d) |
| FestivalToken | `0x5ea6c8f79943148811f8CFCc0CC4DdFd66518E53` | [View ↗](https://sepolia.etherscan.io/address/0x5ea6c8f79943148811f8CFCc0CC4DdFd66518E53) |
| FestivalVault | `0x559504A83Cc1cFb3f096568AB7E8b7eC0AC94793` | [View ↗](https://sepolia.etherscan.io/address/0x559504A83Cc1cFb3f096568AB7E8b7eC0AC94793) |
| USDT (Sepolia) | `0xaa8e23fb1079ea71e0a56f48a2aa51851d8433d0` | [View ↗](https://sepolia.etherscan.io/address/0xaa8e23fb1079ea71e0a56f48a2aa51851d8433d0) |

## Tech Stack

| Layer | Technology |
|-------|------------|
| Frontend | Next.js 15, React 19, Tailwind CSS |
| Wallet | Tether WDK (EVM) |
| Smart Contracts | Solidity 0.8.20, OpenZeppelin, Hardhat |
| Blockchain | Ethereum Sepolia (testnet) |
| Package Manager | pnpm 9.0.0 |

## Project Structure

```
orby/
├── apps/
│   └── web/                    # Next.js frontend
│       ├── app/
│       │   ├── api/            # API routes
│       │   │   ├── admin/      # Admin endpoints
│       │   │   └── festival/   # User endpoints
│       │   ├── wallet/         # Wallet view
│       │   ├── admin/          # Admin dashboard
│       │   └── login/          # Authentication
│       └── lib/
│           └── wdk/            # WDK client & server modules
│
└── packages/
    ├── contracts/              # Solidity smart contracts
    │   ├── contracts/          # Source .sol files
    │   ├── scripts/            # Deployment scripts
    │   └── test/               # Contract tests
    │
    └── types/                  # Shared TypeScript types
```

## Setup Instructions

### Prerequisites

- Node.js >= 18.0.0
- pnpm 9.0.0+
- A Sepolia testnet wallet with ETH for gas

### 1. Install Dependencies

```bash
pnpm install
```

### 2. Configure Environment Variables

Create `.env.local` in `apps/web/`:

```bash
# Sepolia RPC URL (required)
SEPOLIA_RPC_URL=https://eth-sepolia.g.alchemy.com/v2/YOUR_API_KEY
NEXT_PUBLIC_SEPOLIA_RPC_URL=https://eth-sepolia.g.alchemy.com/v2/YOUR_API_KEY

# WDK seed phrase for server-side transactions (required)
WDK_SEED_PHRASE="your twelve word mnemonic phrase here"

# Contract addresses (use deployed addresses or deploy your own)
FACTORY_ADDRESS=0x73eA5768CF25b4D9Ee342A364948543E202C2D8d
TOKEN_ADDRESS=0x5ea6c8f79943148811f8CFCc0CC4DdFd66518E53
VAULT_ADDRESS=0x559504A83Cc1cFb3f096568AB7E8b7eC0AC94793
USDT_ADDRESS=0xaa8e23fb1079ea71e0a56f48a2aa51851d8433d0
```

Create `.env` in `packages/contracts/`:

```bash
# Private key for contract deployment
PRIVATE_KEY=your_private_key_here

# Sepolia RPC URL
SEPOLIA_RPC_URL=https://eth-sepolia.g.alchemy.com/v2/YOUR_API_KEY

# Factory address (after deployment)
FESTIVAL_FACTORY_ADDRESS=0x73eA5768CF25b4D9Ee342A364948543E202C2D8d
```

### 3. Run Development Server

```bash
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

## Environment Variables Reference

### Frontend (`apps/web/.env.local`)

| Variable | Required | Description |
|----------|----------|-------------|
| `SEPOLIA_RPC_URL` | Yes | Sepolia RPC endpoint for server-side calls |
| `NEXT_PUBLIC_SEPOLIA_RPC_URL` | Yes | Sepolia RPC endpoint for client-side calls |
| `WDK_SEED_PHRASE` | Yes | BIP-39 mnemonic for server wallet (12 words) |
| `FACTORY_ADDRESS` | No | FestivalFactory contract address |
| `TOKEN_ADDRESS` | No | FestivalToken contract address |
| `VAULT_ADDRESS` | No | FestivalVault contract address |
| `USDT_ADDRESS` | No | Sepolia USDT address (default: `0xaa8e...d0`) |

### Contracts (`packages/contracts/.env`)

| Variable | Required | Description |
|----------|----------|-------------|
| `PRIVATE_KEY` | Yes | Deployer wallet private key |
| `SEPOLIA_RPC_URL` | Yes | Sepolia RPC endpoint |
| `FESTIVAL_FACTORY_ADDRESS` | No | Deployed factory address |

## Deployment Guide

### Deploy Smart Contracts

1. **Compile contracts:**
   ```bash
   cd packages/contracts
   pnpm compile
   ```

2. **Deploy FestivalFactory:**
   ```bash
   pnpm deploy:factory
   ```
   This deploys the factory contract and logs the address. Update `FESTIVAL_FACTORY_ADDRESS` in `.env`.

3. **Create a Festival:**
   ```bash
   pnpm create:festival
   ```
   This creates a new FestivalToken + FestivalVault pair and saves the config to `festival-config.json`.

4. **Test the Flow:**
   ```bash
   pnpm test:flow
   ```
   Executes a complete deposit/withdrawal cycle to verify the system.

### Verify System Integrity

```bash
cd packages/contracts
npx hardhat run scripts/verifySystem.ts --network sepolia
```

This script checks:
- Factory deployment status
- Active festival configuration
- Vault USDT balance
- Token total supply
- Escrow invariant (1:1 backing)

## API Documentation

### User Endpoints

#### `POST /api/festival/join`

Join a festival and receive a wallet address.

**Request:**
```json
{
  "nickname": "string"
}
```

**Response:**
```json
{
  "userId": "uuid",
  "sessionToken": "uuid",
  "address": "0x..."
}
```

---

#### `POST /api/festival/topup`

Deposit USDT and receive festival tokens.

**Request:**
```json
{
  "userId": "string",
  "sessionToken": "string",
  "amountUsdt": 100
}
```

**Response:**
```json
{
  "success": true,
  "approvalHash": "0x...",
  "depositHash": "0x..."
}
```

---

#### `POST /api/festival/cashout`

Withdraw all festival tokens and receive USDT.

**Request:**
```json
{
  "userId": "string"
}
```

**Response:**
```json
{
  "success": true,
  "withdrawHash": "0x...",
  "usdtReturned": "100000000"
}
```

---

#### `GET /api/festival/balances?userId={userId}`

Query on-chain balances.

**Response:**
```json
{
  "usdt": "1000000",
  "festivalTokens": "1000000000000000000",
  "escrowedUSDT": "1000000",
  "userAddress": "0x...",
  "treasuryAddress": "0x..."
}
```

### Admin Endpoints

#### `POST /api/admin/create-festival`

Deploy a new festival token and vault.

**Request:**
```json
{
  "festivalName": "Summer Fest 2025",
  "festivalSymbol": "SF25"
}
```

**Response:**
```json
{
  "name": "Summer Fest 2025",
  "symbol": "SF25",
  "tokenAddress": "0x...",
  "vaultAddress": "0x...",
  "ownerAddress": "0x...",
  "transactionHash": "0x..."
}
```

## Smart Contract Interfaces

#### FestivalToken (ERC20)
```solidity
function mint(address to, uint256 amount) external;    // onlyOwner
function burn(address from, uint256 amount) external;  // onlyOwner
```

#### FestivalVault
```solidity
function deposit(uint256 usdtAmount) external;
function withdraw(uint256 tokenAmount) external;
function setRedemptionOpen(bool open) external;        // onlyOwner
function escrowedUSDT(address user) external view returns (uint256);
function redemptionOpen() external view returns (bool);
```

#### FestivalFactory
```solidity
function createFestival(
    string calldata name,
    string calldata symbol,
    uint256 startTime,
    uint256 endTime
) external returns (address token, address vault);

event FestivalCreated(
    address indexed token,
    address indexed vault,
    string name,
    string symbol
);
```

## Testing

### Run All Tests

```bash
# Frontend tests
cd apps/web
pnpm test

# Contract tests
cd packages/contracts
pnpm test
```

### Test Coverage

```bash
# Frontend coverage
cd apps/web
pnpm test:coverage

# Contract coverage
cd packages/contracts
npx hardhat coverage
```

## Common Commands

```bash
# Install dependencies
pnpm install

# Development
pnpm dev              # Start Next.js dev server

# Build
pnpm build            # Build the web app

# Linting
pnpm lint             # Run linting

# Contract commands
cd packages/contracts
pnpm compile          # Compile contracts
pnpm test             # Run contract tests
pnpm deploy:factory   # Deploy factory to Sepolia
pnpm create:festival  # Create new festival
pnpm test:flow        # Test deposit/withdraw flow
```

## License

MIT
