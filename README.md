# Atomic Flow

Next.js (App Router) + TypeScript + Tailwind + shadcn/ui + Supabase Auth + Supabase Postgres + Prisma + Vercel iskeleti.

## Özellikler

- Supabase Auth (email + password)
- Prisma ile Supabase Postgres veri modeli
- Server-side skor hesaplama motoru (`ruleJson`)
- Setup / Daily / Weekly / Monthly ekranları
- API route'ları:
  - `POST /api/entries`
  - `GET /api/weekly?weekStart=YYYY-MM-DD`
  - `GET /api/monthly?month=YYYY-MM`
  - `POST /api/seed`
- Planlı gün desteği (`HabitSchedule`)

## 1) Kurulum (Local)

```bash
pnpm install
cp .env.example .env
```

`.env` içine doldurun:

```env
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=
DATABASE_URL=
DIRECT_URL=
```

Prisma:

```bash
pnpm db:generate
pnpm db:migrate --name init
```

Opsiyonel local seed (tek kullanıcıya):

```bash
SEED_SUPABASE_USER_ID=<supabase-user-uuid> pnpm db:seed
```

Çalıştır:

```bash
pnpm dev
```

## 2) Supabase Adımları

1. Supabase'de yeni project açın.
2. `Authentication -> Providers -> Email` açık olsun.
3. `Project Settings -> API` altından:
   - `URL` -> `NEXT_PUBLIC_SUPABASE_URL`
   - `anon key` -> `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `service_role key` -> `SUPABASE_SERVICE_ROLE_KEY`
4. `Project Settings -> Database` altından connection stringleri alın:
   - Transaction/Pooled -> `DATABASE_URL`
   - Direct -> `DIRECT_URL`
5. İlk migration'ı localden çalıştırıp tabloyu oluşturun.

## 3) Vercel Deploy (Free Tier)

1. Kodu GitHub'a push edin.
2. Vercel'de `Add New -> Project` ile repo import edin.
3. Framework: Next.js otomatik algılanır.
4. `Environment Variables` alanına `.env` değişkenlerini ekleyin.
5. Deploy edin.

GitHub entegrasyonu sonrası:

- `main` branch push -> Production deploy
- Pull Request -> Preview deploy

## 4) Kullanım Akışı

1. `/login` üzerinden kayıt/giriş.
2. `/setup`:
   - Kendi alışkanlıklarınızı ekleyin veya `Örnek alışkanlıklar` butonuyla 5 hazır alışkanlığı ekleyin.
   - Preset kural seçin.
   - Gerekirse planlı gün seçin.
3. `/daily`:
   - Tarih seçin, metrikleri girin, kaydedin.
   - Skor otomatik hesaplanır.
4. `/weekly`:
   - Pzt-Paz tablo görünümü, satır bazlı toplam/ortalama/% ve genel satır.
5. `/monthly`:
   - Haftalık genel yüzdeler + aylık ortalama yüzde.

## 5) Önemli Notlar

- RLS yerine uygulama seviyesinde `userId` scope uygulanır.
- Prisma client singleton kullanılır (`src/lib/prisma.ts`) ve serverless ortama uygundur.
- Kural motoru tamamen server-side çalışır (`src/lib/score-engine.ts` + `POST /api/entries`).
