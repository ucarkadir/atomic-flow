import { PrismaClient, RuleType } from "@prisma/client";

const prisma = new PrismaClient();

type Condition = {
  metric: "minutes" | "pages" | "outputCount" | "didOutput";
  op: "gte" | "eq";
  value: number | boolean;
};

type RuleJson = {
  levels: Array<{ score: number; any: Array<{ all: Condition[] }> }>;
};

const singleMetricRule = (
  metric: "minutes" | "pages" | "outputCount",
  thresholds: Array<[number, number]>
): RuleJson => ({
  levels: thresholds.map(([score, min]) => ({
    score,
    any: [{ all: [{ metric, op: "gte", value: min }] }]
  }))
});

const englishRule: RuleJson = {
  levels: [
    {
      score: 5,
      any: [
        { all: [{ metric: "minutes", op: "gte", value: 45 }] },
        {
          all: [
            { metric: "minutes", op: "gte", value: 30 },
            { metric: "outputCount", op: "gte", value: 10 }
          ]
        },
        {
          all: [
            { metric: "minutes", op: "gte", value: 30 },
            { metric: "didOutput", op: "eq", value: true }
          ]
        }
      ]
    },
    { score: 4, any: [{ all: [{ metric: "minutes", op: "gte", value: 30 }] }] },
    { score: 3, any: [{ all: [{ metric: "minutes", op: "gte", value: 15 }] }] },
    { score: 2, any: [{ all: [{ metric: "minutes", op: "gte", value: 2 }] }] },
    { score: 1, any: [{ all: [] }] }
  ]
};

async function main() {
  const supabaseUserId = process.env.SEED_SUPABASE_USER_ID;

  if (!supabaseUserId) {
    console.log("SEED_SUPABASE_USER_ID tanimli degil, seed atlandi.");
    return;
  }

  const user = await prisma.user.upsert({
    where: { supabaseUserId },
    update: {},
    create: { supabaseUserId }
  });

  const existing = await prisma.habit.count({ where: { userId: user.id } });
  if (existing > 0) {
    console.log("Kullanicinin zaten aliskanliklari var, seed atlandi.");
    return;
  }

  await prisma.habit.createMany({
    data: [
      {
        userId: user.id,
        habitName: "Kitap okuma",
        identityStatement: "Her gun okuyan biriyim",
        implementationIntention: "Her gun 21:00 evde",
        habitStacking: "Cay koyduktan sonra 20 sayfa okurum",
        trackingStacking: "Okuma biter bitmez skoru girerim",
        weeklyTargetText: "Haftada 5 gun 20+ sayfa",
        ruleType: RuleType.SINGLE_METRIC,
        ruleJson: singleMetricRule("pages", [
          [5, 35],
          [4, 28],
          [3, 20],
          [2, 10],
          [1, 0]
        ])
      },
      {
        userId: user.id,
        habitName: "Ingilizce",
        identityStatement: "Aktif Ingilizce kullanan biriyim",
        implementationIntention: "Her gun 08:00 masa basinda",
        habitStacking: "Kahveden sonra 30+ dakika Ingilizce",
        trackingStacking: "Dersi bitirince girdi olustururum",
        weeklyTargetText: "Haftada 6 gun",
        ruleType: RuleType.DOUBLE_METRIC,
        ruleJson: englishRule
      }
    ]
  });

  console.log("Seed tamamlandi.");
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
