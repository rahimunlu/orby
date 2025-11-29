# Project Structure

```
orby/
├── apps/
│   └── web/                    # Next.js frontend application
│       ├── app/                # App Router pages
│       │   ├── api/            # API routes (Next.js Route Handlers)
│       │   │   ├── admin/      # Admin endpoints (create-festival, festival)
│       │   │   └── festival/   # User endpoints (join, topup, cashout, balances)
│       │   ├── wallet/         # Main wallet view
│       │   ├── activity/       # Transaction history
│       │   ├── menu/           # Settings/menu
│       │   ├── qr/             # QR code scanner/display
│       │   └── admin/          # Admin dashboard
│       ├── components/         # Shared React components
│       │   ├── Layout.tsx      # Page wrapper with navigation
│       │   └── BottomNav.tsx   # Mobile bottom navigation
│       └── lib/                # Utilities and services
│           ├── api.ts          # API client functions
│           ├── session.ts      # LocalStorage session management
│           └── store.ts        # In-memory balance store (mock)
│
└── packages/
    ├── contracts/              # Solidity smart contracts
    │   ├── contracts/          # Source .sol files
    │   ├── artifacts/          # Compiled contract ABIs
    │   ├── typechain-types/    # Generated TypeScript bindings
    │   ├── scripts/            # Deployment scripts
    │   └── test/               # Contract tests
    │
    └── types/                  # Shared TypeScript types (@orby/types)
        └── src/index.ts        # Type definitions
```

## Key Conventions

- **API Routes**: Located in `apps/web/app/api/`, use Next.js Route Handlers with `route.ts` files
- **Pages**: Use App Router conventions with `page.tsx` files
- **Client Components**: Mark with `'use client'` directive at top of file
- **Shared Types**: Import from `@orby/types` package
- **Path Aliases**: Use `@/` for imports within the web app (e.g., `@/lib/api`)
- **Styling**: Tailwind utility classes, custom colors defined in `tailwind.config.ts`
