# Tech Stack

## Build System & Package Management

- **Monorepo**: pnpm workspaces
- **Package Manager**: pnpm 9.0.0
- **Node Version**: >=18.0.0

## Frontend (apps/web)

- **Framework**: Next.js 15 (App Router)
- **React**: 19
- **Styling**: Tailwind CSS 3.4
- **Icons**: lucide-react
- **TypeScript**: 5.8

## Smart Contracts (packages/contracts)

- **Framework**: Hardhat (inferred from artifacts/typechain structure)
- **Contracts**: OpenZeppelin-based ERC-20 tokens
  - FestivalToken
  - FestivalVault
  - FestivalFactory

## Shared Packages

- `@orby/types`: Shared TypeScript types

## Common Commands

```bash
# Install dependencies
pnpm install

# Development
pnpm dev          # Start Next.js dev server

# Build
pnpm build        # Build the web app

# Start production
pnpm start        # Start production server

# Lint
pnpm lint         # Run linting
```

## Environment Variables

- `NEXT_PUBLIC_API_URL`: API base URL (optional, defaults to same origin)
- `GEMINI_API_KEY`: For AI Studio integration (set in .env.local)
