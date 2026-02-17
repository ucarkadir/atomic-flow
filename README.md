# Atomic Flow

Next.js (App Router) + TypeScript + Tailwind + shadcn/ui + Supabase Auth + Supabase Postgres + Prisma ile esnek metrikli aliskanlik takip uygulamasi.

## Ozellikler

- Supabase Auth (email + password)
- Prisma + Supabase Postgres
- Dinamik metrik modeli (habit basi 0..2 metrik)
- Dinamik ruleJson score engine (single/double/completed)
- Operatorler: `or`, `and`, `gte`, `lte`, `eq`, `between`
- `missingHandling`: `NA` veya `SCORE_1..SCORE_5`
- Negatif aliskanliklar icin `invertScore`
- Planli gun (`HabitSchedule`) + N/A davranisi
- Ekranlar: `/setup`, `/daily`, `/weekly`, `/monthly`, `/help`

## API

- `POST /api/entries` -> daily entry upsert + score hesaplama
- `GET /api/weekly?weekStart=YYYY-MM-DD`
- `GET /api/monthly?month=YYYY-MM`
- `POST /api/seed`
- `GET /api/habits/:id/rule`

## Kurulum (Local)

```bash
corepack pnpm install
cp .env.example .env
```

`.env`:

```env
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=
DATABASE_URL=
DIRECT_URL=
```

Prisma:

```bash
corepack pnpm db:generate
corepack pnpm db:deploy
```

Gelistirme:

```bash
corepack pnpm dev
```

Test/Lint/Build:

```bash
corepack pnpm test
corepack pnpm lint
corepack pnpm build
```

## Supabase Kurulumu

1. Supabase project olustur.
2. `Authentication -> Providers -> Email` acik olsun.
3. `Settings -> Data API`:
   - `Project URL` -> `NEXT_PUBLIC_SUPABASE_URL`
   - `Anon key` -> `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `service_role` -> `SUPABASE_SERVICE_ROLE_KEY`
4. `Settings -> Database -> Connection string`:
   - pooled/transaction uri -> `DATABASE_URL`
   - direct uri -> `DIRECT_URL`

## Vercel Deploy (GitHub Auto Deploy)

1. Repo'yu GitHub'a push et.
2. Vercel `Add New -> Project` ile import et.
3. Environment variables olarak `.env` degiskenlerini gir.
4. Deploy et.

Sonrasinda:

- `main` push -> Production deploy
- PR -> Preview deploy

## Seed

Uygulamada `/setup` sayfasindaki `Ornek aliskanliklar` butonu ile 5 varsayilan aliskanligi ekleyebilirsin.

## Help Sayfasi

`/help` sayfasi su konulari aciklar:

- Metric1 / Metric2 / Completed / Notes
- Skor hesaplama (single/double/completed)
- Invert score
- Haftalik yuzde formulu (`filledDays`, `sum`, `avg`, `percent`)
- Planli gun ve N/A

`/daily` kartlarindaki "Bu aliskanlik nasil hesaplanir?" linki `GET /api/habits/:id/rule` ile ruleJson detayini gosterir.
