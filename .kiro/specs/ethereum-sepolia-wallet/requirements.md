# Requirements Document

## Introduction

Orby is a festival payment MVP on Ethereum Sepolia that enables festival attendees to manage digital wallets and exchange USDT for festival-specific tokens. The system implements a Vault-based Escrow Architecture where an Admin deploys FestivalToken (ERC20) and FestivalVault contracts via a FestivalFactory. The architecture enforces strict 1:1 backing: USDT deposits are locked in the Vault while Festival Tokens are minted, and tokens are burned to release locked USDT during cashout. The frontend uses Tether WDK EVM for secure wallet management on Ethereum Sepolia (Chain ID: 11155111).

## Glossary

- **Orby_System**: The complete festival payment application including frontend, backend APIs, and smart contracts
- **WDK**: Tether Wallet Development Kit for EVM-compatible wallet management
- **FestivalToken**: An ERC20 token representing festival currency, mintable and burnable by the Vault
- **FestivalVault**: Smart contract that holds escrowed USDT and manages token minting/burning
- **FestivalFactory**: Smart contract that deploys paired FestivalToken and FestivalVault contracts
- **USDT**: Tether USD stablecoin used as the backing currency (Sepolia testnet version)
- **Escrow**: USDT locked in the Vault that backs circulating Festival Tokens
- **Redemption**: The process of burning Festival Tokens to withdraw escrowed USDT
- **Sepolia**: Ethereum testnet with Chain ID 11155111
- **Mnemonic**: BIP-39 seed phrase used for wallet generation and recovery

## Requirements

### Requirement 1: Wallet Creation and Login

**User Story:** As a festival attendee, I want to create and access a secure wallet, so that I can manage my festival funds.

#### Acceptance Criteria

1. WHEN a user without an existing wallet clicks "Create New Wallet" THEN the Orby_System SHALL generate a BIP-39 mnemonic using WDK.getRandomSeedPhrase() and store it in localStorage under key 'orby_seed'
2. WHEN a user with an existing seed clicks "Login" THEN the Orby_System SHALL initialize WDK with the stored mnemonic, register the EVM wallet using WalletManagerEvm with Sepolia RPC, and redirect to the home page
3. WHEN the login page loads THEN the Orby_System SHALL check localStorage for 'orby_seed' and enable the "Login" button only if a seed exists
4. WHEN a user without a wallet attempts to access protected pages THEN the Orby_System SHALL redirect the user to the login page
5. WHEN the WDK wallet is initialized THEN the Orby_System SHALL configure it for Ethereum Sepolia network with Chain ID 11155111

### Requirement 2: Smart Contract Architecture

**User Story:** As a festival organizer, I want a secure escrow-based token system, so that festival tokens are always backed 1:1 by USDT.

#### Acceptance Criteria

1. WHEN the FestivalFactory deploys a new festival THEN the Orby_System SHALL create both a FestivalToken and FestivalVault contract pair
2. WHEN a FestivalToken is deployed THEN the Orby_System SHALL configure it as an ERC20 token with mint and burn functions restricted to the owner
3. WHEN a FestivalVault is deployed THEN the Orby_System SHALL transfer FestivalToken ownership to the Vault contract
4. WHEN the FestivalFactory creates contracts THEN the Orby_System SHALL emit a FestivalCreated event containing token and vault addresses
5. WHEN contracts are deployed THEN the Orby_System SHALL use Solidity version 0.8.20 and OpenZeppelin contracts

### Requirement 3: USDT Deposit and Token Minting

**User Story:** As a festival attendee, I want to deposit USDT and receive festival tokens, so that I can make purchases at the festival.

#### Acceptance Criteria

1. WHEN a user deposits USDT into the Vault THEN the Orby_System SHALL transfer USDT from user to Vault and mint Festival Tokens at 1:1 ratio (adjusting for decimal differences: 6 to 18)
2. WHEN a deposit is processed THEN the Orby_System SHALL update the user's escrowedUSDT balance in the Vault contract
3. WHEN a user initiates a deposit via API THEN the Orby_System SHALL first execute USDT approval transaction then execute the deposit transaction
4. WHEN a deposit transaction completes THEN the Orby_System SHALL return both approval and deposit transaction hashes

### Requirement 4: Token Redemption and USDT Withdrawal

**User Story:** As a festival attendee, I want to cash out my remaining festival tokens, so that I can recover my unused USDT.

#### Acceptance Criteria

1. WHEN a user withdraws from the Vault THEN the Orby_System SHALL burn the user's Festival Tokens and transfer equivalent USDT from Vault to user
2. WHEN a withdrawal is requested THEN the Orby_System SHALL verify that redemption is open or the festival end time has passed
3. WHEN a withdrawal is processed THEN the Orby_System SHALL verify the user has sufficient escrowed USDT balance
4. WHEN a cashout is initiated via API THEN the Orby_System SHALL query the user's token balance and withdraw the full amount
5. WHEN the Vault owner calls setRedemptionOpen THEN the Orby_System SHALL update the redemption status accordingly

### Requirement 5: Balance Display and Verification

**User Story:** As a festival attendee, I want to view my current balances, so that I can track my available funds.

#### Acceptance Criteria

1. WHEN the wallet page loads THEN the Orby_System SHALL display the user's USDT balance from the blockchain
2. WHEN the wallet page loads THEN the Orby_System SHALL display the user's Festival Token balance from the blockchain
3. WHEN the wallet page loads THEN the Orby_System SHALL display the amount of USDT locked in the Vault for the user
4. WHEN balances are displayed THEN the Orby_System SHALL show the redemption status (Open or Closed)

### Requirement 6: Admin Festival Management

**User Story:** As a festival organizer, I want to deploy and manage festival contracts, so that I can set up the payment infrastructure.

#### Acceptance Criteria

1. WHEN an admin creates a festival THEN the Orby_System SHALL call FestivalFactory.createFestival with name, symbol, start time, and end time
2. WHEN a festival is created THEN the Orby_System SHALL store the Token and Vault addresses in the application configuration
3. WHEN the admin page loads THEN the Orby_System SHALL display deployed Token and Vault addresses with Sepolia Etherscan links
4. WHEN the admin creates a festival THEN the Orby_System SHALL use the server-side WDK instance with account index 0

### Requirement 7: Contract Deployment Infrastructure

**User Story:** As a developer, I want deployment scripts for the smart contracts, so that I can deploy and test the system on Sepolia.

#### Acceptance Criteria

1. WHEN deployFactory script runs THEN the Orby_System SHALL deploy FestivalFactory to Sepolia and log the contract address
2. WHEN createFestival script runs THEN the Orby_System SHALL connect to the deployed Factory and create a new festival
3. WHEN testFlow script runs THEN the Orby_System SHALL execute a complete deposit and withdrawal cycle and verify balances
4. WHEN deployment scripts execute THEN the Orby_System SHALL use the official Sepolia USDT address 0xaa8e23fb1079ea71e0a56f48a2aa51851d8433d0

### Requirement 8: System Verification

**User Story:** As a developer, I want to verify the system integrity, so that I can ensure the escrow invariant holds.

#### Acceptance Criteria

1. WHEN verifySystem script runs THEN the Orby_System SHALL check that the Factory is deployed on Sepolia
2. WHEN verifySystem script runs THEN the Orby_System SHALL verify that Vault USDT balance equals Token total supply
3. WHEN verifySystem script runs THEN the Orby_System SHALL report the active festival configuration and user balances

### Requirement 9: Transaction Encoding and Signing

**User Story:** As a developer, I want proper transaction handling, so that contract interactions are secure and reliable.

#### Acceptance Criteria

1. WHEN encoding contract calls THEN the Orby_System SHALL use Viem's encodeFunctionData for ABI encoding
2. WHEN signing and broadcasting transactions THEN the Orby_System SHALL use the WDK wallet manager
3. WHEN server-side transactions are needed THEN the Orby_System SHALL use WDK account index 0 for admin operations and index 1 for demo user operations
