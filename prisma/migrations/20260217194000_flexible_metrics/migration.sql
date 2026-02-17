-- Add new flexible habit columns
ALTER TABLE "Habit"
  ADD COLUMN "metric1Label" TEXT NOT NULL DEFAULT '',
  ADD COLUMN "metric1Unit" TEXT NOT NULL DEFAULT '',
  ADD COLUMN "metric2Label" TEXT,
  ADD COLUMN "metric2Unit" TEXT,
  ADD COLUMN "supportsCompletedOnly" BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN "invertScore" BOOLEAN NOT NULL DEFAULT false;

-- Add new flexible entry columns
ALTER TABLE "DailyEntry"
  ADD COLUMN "metric1Value" DOUBLE PRECISION,
  ADD COLUMN "metric2Value" DOUBLE PRECISION,
  ADD COLUMN "completed" BOOLEAN;

-- Best-effort data migration from legacy columns
UPDATE "DailyEntry"
SET
  "metric1Value" = COALESCE("minutes", "pages", "outputCount")::double precision,
  "metric2Value" = CASE
    WHEN "outputCount" IS NOT NULL AND ("minutes" IS NOT NULL OR "pages" IS NOT NULL)
      THEN "outputCount"::double precision
    ELSE NULL
  END,
  "completed" = "didOutput";

-- Habit metadata + rules for known seeded habits
UPDATE "Habit"
SET
  "metric1Label" = 'Sayfa',
  "metric1Unit" = 'syf',
  "ruleJson" = jsonb_build_object(
    'mode', 'single',
    'metric', 'm1',
    'levels', jsonb_build_object(
      '5', jsonb_build_object('gte', 35),
      '4', jsonb_build_object('gte', 28),
      '3', jsonb_build_object('gte', 20),
      '2', jsonb_build_object('gte', 10),
      '1', jsonb_build_object('else', true)
    )
  )
WHERE "habitName" = 'Kitap okuma';

UPDATE "Habit"
SET
  "metric1Label" = 'Dakika',
  "metric1Unit" = 'dk',
  "metric2Label" = 'Cumle',
  "metric2Unit" = 'adet',
  "ruleJson" = jsonb_build_object(
    'mode', 'double',
    'missingHandling', 'SCORE_1',
    'levels', jsonb_build_object(
      '5', jsonb_build_object('or', jsonb_build_array(
        jsonb_build_object('m1', jsonb_build_object('gte', 45)),
        jsonb_build_object('and', jsonb_build_array(
          jsonb_build_object('m1', jsonb_build_object('gte', 30)),
          jsonb_build_object('m2', jsonb_build_object('gte', 10))
        ))
      )),
      '4', jsonb_build_object('m1', jsonb_build_object('gte', 30)),
      '3', jsonb_build_object('m1', jsonb_build_object('gte', 15)),
      '2', jsonb_build_object('m1', jsonb_build_object('gte', 2)),
      '1', jsonb_build_object('else', true)
    )
  )
WHERE "habitName" = 'Ingilizce';

UPDATE "Habit"
SET
  "metric1Label" = 'Dakika',
  "metric1Unit" = 'dk',
  "ruleJson" = jsonb_build_object(
    'mode', 'single',
    'metric', 'm1',
    'levels', jsonb_build_object(
      '5', jsonb_build_object('gte', 50),
      '4', jsonb_build_object('gte', 35),
      '3', jsonb_build_object('gte', 20),
      '2', jsonb_build_object('gte', 10),
      '1', jsonb_build_object('else', true)
    )
  )
WHERE "habitName" IN ('Egzersiz', 'Dans');

UPDATE "Habit"
SET
  "metric1Label" = 'Dakika',
  "metric1Unit" = 'dk',
  "metric2Label" = 'Gorev',
  "metric2Unit" = 'adet',
  "ruleJson" = jsonb_build_object(
    'mode', 'double',
    'levels', jsonb_build_object(
      '5', jsonb_build_object('or', jsonb_build_array(
        jsonb_build_object('m1', jsonb_build_object('gte', 45)),
        jsonb_build_object('and', jsonb_build_array(
          jsonb_build_object('m1', jsonb_build_object('gte', 30)),
          jsonb_build_object('m2', jsonb_build_object('gte', 1))
        ))
      )),
      '4', jsonb_build_object('m1', jsonb_build_object('gte', 30)),
      '3', jsonb_build_object('m1', jsonb_build_object('gte', 20)),
      '2', jsonb_build_object('m1', jsonb_build_object('gte', 10)),
      '1', jsonb_build_object('else', true)
    )
  )
WHERE "habitName" = 'Teknik gelisim';

-- Fallback defaults for any other existing habits
UPDATE "Habit"
SET
  "metric1Label" = CASE WHEN "metric1Label" = '' THEN 'Metric 1' ELSE "metric1Label" END,
  "metric1Unit" = CASE WHEN "metric1Unit" = '' THEN 'adet' ELSE "metric1Unit" END
WHERE "metric1Label" = '' OR "metric1Unit" = '';

-- Remove legacy fixed metric columns
ALTER TABLE "DailyEntry"
  DROP COLUMN "minutes",
  DROP COLUMN "pages",
  DROP COLUMN "outputCount",
  DROP COLUMN "didOutput";

ALTER TABLE "Habit"
  DROP COLUMN "ruleType";

-- Remove old enum no longer used
DROP TYPE IF EXISTS "RuleType";
