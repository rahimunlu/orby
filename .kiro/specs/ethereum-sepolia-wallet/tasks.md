# Implementation Plan

> ⚠️ **ÖNEMLİ UYARI**: Her seferinde SADECE BİR TASK (örn: 1.1) tamamla ve DUR. Sonraki task için kullanıcıdan açık komut bekle. ASLA otomatik olarak bir sonraki task'e geçme!

- [-] 1. Set up WDK dependencies and client-side wallet manager



  - [ ] 1.1 Install WDK and Viem dependencies
    - Install @tetherto/wdk, @tetherto/wdk-wallet-evm, and viem packages

    - _Requirements: 1.5_
  - [x] 1.2 Create WDK client singleton (`apps/web/lib/wdk/client.ts`)





    - Use WDK.getRandomSeedPhrase() to generate BIP-39 mnemonic
    - Store mnemonic in localStorage under 'orby_seed' key
    - Initialize WDK with `new WDK(seedPhrase)` and register wallet with `registerWallet('ethereum', WalletManagerEvm, { provider: rpcUrl })`
    - Use `wdk.getAccount('ethereum', index)` to get accounts
    - Use `account.getAddress()` and `account.getBalance()` for wallet operations
    - _Requirements: 1.1, 1.2, 1.3, 1.5_
  - [x] 1.3 Write property test for wallet creation and detection





    - **Property 1: Wallet Creation and Detection Consistency**
    --**Validates: Requirements 1.1, 1.3**

  - [x] 1.4 Write property test for login initialization




    - **Property 2: Login Initializes Wallet from Stored Seed**
    - **Validates: Requirements 1.2**

- [x] 2. Implement Login page UI






  - [x] 2.1 Create login page (`apps/web/app/login/page.tsx`)

    - Check localStorage for existing seed on mount
    - "Create New Wallet" button: generates seed, stores in localStorage
    - "Login" button: initializes WDK, redirects to home
    - Match existing UI style (electric blue, dark cards)
    - _Requirements: 1.1, 1.2, 1.3_
  - [x] 2.2 Update home page to redirect unauthenticated users


    - Check wallet initialization state
    - Redirect to /login if no wallet
    - _Requirements: 1.4_

- [x] 3. Checkpoint - Ensure wallet management tests pass





  - Ensure all tests pass, ask the user if questions arise.

- [x] 4. Implement Smart Contracts




  - [x] 4.1 Set up Hardhat configuration for Sepolia


    - Configure hardhat.config.ts with Sepolia network (chainId: 11155111)
    - Set Solidity version 0.8.20
    - Install @openzeppelin/contracts
    - _Requirements: 2.5, 7.4_
  - [x] 4.2 Implement FestivalToken contract


    - Create ERC20 token with Ownable
    - Implement mint(to, amount) restricted to owner
    - Implement burn(from, amount) restricted to owner
    - _Requirements: 2.2_


  - [x] 4.3 Write property test for token access control


    - **Property 4: Token Mint/Burn Access Control**
    - **Validates: Requirements 2.2**
  - [x] 4.4 Implement FestivalVault contract

    - Constructor: usdt, token, start, end, owner
    - State: escrowedUSDT mapping, redemptionOpen boolean
    - deposit(amount): transfer USDT, mint tokens (6 to 18 decimal conversion)
    - withdraw(amount): check redemption, burn tokens, transfer USDT
    - setRedemptionOpen(bool): onlyOwner
    - _Requirements: 3.1, 3.2, 4.1, 4.2, 4.3, 4.5_
  - [x] 4.5 Write property test for deposit ratio


    - **Property 5: Deposit Mints Tokens at Correct Ratio**
    - **Validates: Requirements 3.1, 3.2**
  - [x] 4.6 Write property test for withdrawal mechanics


    - **Property 6: Withdrawal Burns Tokens and Returns USDT**
    - **Validates: Requirements 4.1**

  - [x] 4.7 Write property test for redemption gating

    - **Property 7: Withdrawal Requires Redemption Open or Festival Ended**
    - **Validates: Requirements 4.2**
  - [x] 4.8 Write property test for escrow balance limit


    - **Property 8: Withdrawal Limited by Escrowed Balance**
    - **Validates: Requirements 4.3**
  - [x] 4.9 Write property test for redemption toggle


    - **Property 10: Redemption Status Toggle**
    - **Validates: Requirements 4.5**
  - [x] 4.10 Implement FestivalFactory contract


    - Constructor: usdtAddress
    - createFestival(name, symbol, start, end): deploy Token + Vault, transfer ownership
    - Emit FestivalCreated event
    - _Requirements: 2.1, 2.3, 2.4_
  - [x] 4.11 Write property test for factory deployment


    - **Property 3: Factory Deployment Creates Valid Contract Pair**
    - **Validates: Requirements 2.1, 2.3, 2.4**
  - [x] 4.12 Write property test for escrow invariant


    - **Property 11: Escrow Invariant (1:1 Backing)**
    - **Validates: Requirements 8.2**

- [x] 5. Checkpoint - Ensure smart contract tests pass





  - Ensure all tests pass, ask the user if questions arise.

- [x] 6. Create deployment scripts





  - [x] 6.1 Create deployFactory script (`packages/contracts/scripts/deployFactory.ts`)
    - Deploy FestivalFactory to Sepolia
    - Use Sepolia USDT address: 0xaa8e23fb1079ea71e0a56f48a2aa51851d8433d0
    - Log contract address
    - _Requirements: 7.1, 7.4_
  - [x] 6.2 Create createFestival script (`packages/contracts/scripts/createFestival.ts`)

    - Connect to deployed Factory
    - Call createFestival with test parameters
    - Save Token and Vault addresses to config
    - _Requirements: 7.2_


  - [x] 6.3 Create testFlow script (`packages/contracts/scripts/testFlow.ts`)

    - Execute deposit and withdrawal cycle
    - Verify balances after each operation
    - _Requirements: 7.3_

- [x] 7. Implement WDK server-side module



  - [x] 7.1 Create WDK server module (`apps/web/lib/wdk/server.ts`)

    - Initialize WDK with mnemonic from WDK_SEED_PHRASE environment variable
    - Use `new WDK(seedPhrase).registerWallet('ethereum', WalletManagerEvm, { provider })` pattern
    - Use `wdk.getAccount('ethereum', index)` - index 0 for admin, index 1 for demo user
    - Use `account.sendTransaction({ to, value, data })` for transactions
    - _Requirements: 9.2, 9.3_


  - [x] 7.2 Create Viem encoding utilities (`apps/web/lib/wdk/encoding.ts`)

    - Import contract ABIs
    - Helper functions for encodeFunctionData
    - _Requirements: 9.1_

- [x] 8. Update API routes for blockchain integration





  - [x] 8.1 Update types package with new interfaces


    - Add vaultAddress to FestivalConfig
    - Update TopupResponse with approvalHash, depositHash
    - Update CashoutResponse with withdrawHash
    - _Requirements: 3.4, 4.4_
  - [x] 8.2 Update create-festival API route


    - Use WDK server (account index 0)
    - Encode createFestival call with Viem
    - Broadcast via WDK
    - Save Token and Vault addresses to config
    - _Requirements: 6.1, 6.2, 6.4_
  - [x] 8.3 Update topup API route


    - Use WDK server (account index 1)
    - Step 1: Encode and send USDT approve(vault, amount)
    - Step 2: Encode and send vault.deposit(amount)
    - Return both transaction hashes
    - _Requirements: 3.3, 3.4_
  - [x] 8.4 Update cashout API route


    - Use WDK server (account index 1)
    - Query user's token balance
    - Encode and send vault.withdraw(balance)
    - Return transaction hash
    - _Requirements: 4.4_
  - [x] 8.5 Write property test for full cashout


    - **Property 9: Cashout Withdraws Full Token Balance**
    - **Validates: Requirements 4.4**
  - [x] 8.6 Update balances API route


    - Query USDT balance from chain
    - Query Festival Token balance from chain
    - Query escrowedUSDT from Vault
    - _Requirements: 5.1, 5.2, 5.3_

- [x] 9. Checkpoint - Ensure API integration tests pass





  - Ensure all tests pass, ask the user if questions arise.

- [x] 10. Update Frontend for blockchain integration
  - [x] 10.1 Update wallet page
    - Display on-chain USDT balance
    - Display on-chain Festival Token balance
    - Display locked USDT in Vault
    - Show redemption status (Open/Closed)
    - Add Deposit button calling /api/festival/topup
    - Add Cash Out button calling /api/festival/cashout
    - _Requirements: 5.1, 5.2, 5.3, 5.4_
  - [x] 10.2 Update admin page
    - Display Token and Vault addresses after creation
    - Add Sepolia Etherscan links for contracts
    - _Requirements: 6.3_
  - [x] 10.3 Add Vault contract link to footer


    - Display Etherscan link to Vault contract
    - _Requirements: 6.3_

- [x] 11. Create system verification script






  - [x] 11.1 Create verifySystem script (`scripts/verifySystem.ts`)

    - Check Factory deployment on Sepolia
    - Check active Festival config
    - Check Vault USDT balance (Total Escrow)
    - Check User Token balance
    - Verify escrow invariant: Vault.usdtBalance == Token.totalSupply / 10^12
    - _Requirements: 8.1, 8.2, 8.3_

- [x] 12. Create README documentation






  - [x] 12.1 Write comprehensive README

    - System overview and architecture
    - Setup instructions
    - Environment variables
    - Deployment guide
    - API documentation
    - _Requirements: All_

- [ ] 13. Final Checkpoint - Ensure all tests pass
  - Ensure all tests pass, ask the user if questions arise.
