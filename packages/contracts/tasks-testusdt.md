# TestUSDT Entegrasyonu - Task List

## Faz 1: Kontrat ✅
- [x] `contracts/TestUSDT.sol` oluştur (ERC20, 6 decimal, faucet fonksiyonu)
- [x] `scripts/deployTestUSDT.ts` yaz
- [x] `package.json`'a `deploy:testusdt` script ekle
- [x] Sepolia'ya deploy et

## Faz 2: Sistem Yeniden Deploy ✅
- [x] `deployFactory.ts` güncelle (TestUSDT adresini kullan)
- [x] Factory'yi yeniden deploy et
- [x] `createFestival.ts` ile yeni festival oluştur (yeni Token + Vault)

## Faz 3: Config Güncellemeleri ✅
- [x] `packages/contracts/.env` güncelle
- [x] `packages/contracts/festival-config.json` güncelle (zaten günceldi)
- [x] `apps/web/.env.local` güncelle (yeni oluşturuldu)

## Faz 4: Kod Güncellemeleri ✅
- [x] `testFlow.ts` - hardcoded USDT adresini env'den oku
- [x] API route'larındaki fallback adresleri güncelle:
  - `topup/route.ts` - USDT ve VAULT adresleri
  - `cashout/route.ts` - TOKEN ve VAULT adresleri
  - `balances/route.ts` - USDT, TOKEN ve VAULT adresleri

## Faz 5: Test ✅
- [x] `pnpm compile` - Başarılı
- [x] `pnpm test` - 52 test geçti
- [x] `pnpm test:flow` - Doğru adresleri okudu (RPC rate limit nedeniyle tam çalışmadı - demo RPC)
- [x] `pnpm dev` - Web app başarıyla başladı, .env.local okunuyor

## Faz 6: UI Geliştirmeleri ✅

### 6.1 Wallet Sayfası - Adres Gösterimi ✅
"Closed" badge yerine kullanıcının wallet adresi gösterilecek.

**Gereksinimler:**
- Kısa format gösterim: `0x1234...5678` (ilk 6 + son 4 karakter)
- Tıklanınca tam adres clipboard'a kopyalanacak
- Kopyalandığında görsel feedback (checkmark veya toast)

**Değişiklikler:**
- [x] `apps/web/app/wallet/page.tsx` - Header'daki redemption badge'i wallet adresi ile değiştir
- [x] `balance.userAddress` kullan (zaten API'den geliyor)
- [x] Copy butonu ekle (lucide-react `Copy` ve `Check` ikonları mevcut)

### 6.2 Admin Dashboard - TestUSDT Faucet ✅
Admin sayfasına TestUSDT faucet bölümü eklenecek.

**Gereksinimler:**
- Adres input alanı (0x... formatında)
- Miktar input alanı (varsayılan: 100 USDT)
- "Send TestUSDT" butonu
- İşlem sonrası tx hash gösterimi

**Backend (API Route):**
- [x] `apps/web/app/api/admin/faucet/route.ts` oluştur
  - POST endpoint: `{ address: string, amount: number }`
  - TestUSDT.faucet(address, amount) çağır
  - Admin account (index 0) ile imzala
  - `onlyOwner` modifier var, admin wallet owner olmalı

**Frontend:**
- [x] `apps/web/app/admin/page.tsx` - Faucet bölümü ekle
  - Input: Wallet adresi
  - Input: Miktar (USDT)
  - Button: "Send TestUSDT"
  - Loading state ve success/error feedback

**Encoding:**
- [x] `apps/web/lib/wdk/encoding.ts` - TestUSDT faucet encoder ekle
  - `TESTUSDT_ABI` tanımla (faucet fonksiyonu)
  - `encodeFaucet(to: Address, amount: bigint)` fonksiyonu

**Not:** TestUSDT.faucet() `onlyOwner` modifier'a sahip. Admin wallet (index 0) contract owner olmalı.

## Yeni Adresler
```
TESTUSDT_ADDRESS=0xD630eb858fA2b08bc816aF83a480eeF4Cc23f843
FACTORY_ADDRESS=0xA0129c4cFE46e53f532ee7F7B9fF4FdeaB832a62
FESTIVAL_TOKEN_ADDRESS=0x506bb9654757044a224E642598C5c30B43b30568
FESTIVAL_VAULT_ADDRESS=0x9965867dC3EEfb856634d4B7aB160f8654402A5b
```
