import { PrismaClient } from "@prisma/client";
import { presetRules } from "../src/lib/score-engine";

const prisma = new PrismaClient();

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
        metric1Label: "Sayfa",
        metric1Unit: "syf",
        metric2Label: null,
        metric2Unit: null,
        supportsCompletedOnly: false,
        invertScore: false,
        ruleJson: presetRules.readingPages
      },
      {
        userId: user.id,
        habitName: "Ingilizce",
        identityStatement: "Aktif Ingilizce kullanan biriyim",
        implementationIntention: "Her gun 08:00 masa basinda",
        habitStacking: "Kahveden sonra 30+ dakika Ingilizce",
        trackingStacking: "Dersi bitirince girdi olustururum",
        weeklyTargetText: "Haftada 6 gun",
        metric1Label: "Dakika",
        metric1Unit: "dk",
        metric2Label: "Cumle",
        metric2Unit: "adet",
        supportsCompletedOnly: false,
        invertScore: false,
        ruleJson: presetRules.englishDouble
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
