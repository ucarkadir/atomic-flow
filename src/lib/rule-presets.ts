import { presetRules, type RuleJson } from "@/lib/score-engine";

export const unitOptions = [
  "dk",
  "saat",
  "syf",
  "bolum",
  "adet",
  "tekrar",
  "cumle",
  "kelime",
  "soru",
  "gorev",
  "pomodoro",
  "set",
  "ml",
  "litre",
  "bardak",
  "m",
  "km",
  "kg",
  "kalori",
  "TL",
  "$",
  "EUR",
  "seans",
  "nefes",
  "meditasyon"
];

export type RulePreset = {
  id: string;
  name: string;
  mode: "single" | "double" | "completed";
  metric1Label: string;
  metric1Unit: string;
  metric2Label?: string;
  metric2Unit?: string;
  supportsCompletedOnly: boolean;
  ruleJson: RuleJson;
};

export const rulePresets: RulePreset[] = [
  {
    id: "reading_pages",
    name: "Kitap (Sayfa)",
    mode: "single",
    metric1Label: "Sayfa",
    metric1Unit: "syf",
    supportsCompletedOnly: false,
    ruleJson: presetRules.readingPages
  },
  {
    id: "minutes_basic",
    name: "Dakika (50/35/20/10)",
    mode: "single",
    metric1Label: "Dakika",
    metric1Unit: "dk",
    supportsCompletedOnly: false,
    ruleJson: {
      mode: "single",
      metric: "m1",
      missingHandling: "NA",
      levels: {
        "5": { m1: { gte: 50 } },
        "4": { m1: { gte: 35 } },
        "3": { m1: { gte: 20 } },
        "2": { m1: { gte: 10 } },
        "1": { else: true }
      }
    }
  },
  {
    id: "english_double",
    name: "Ingilizce (45 veya 30 + 10)",
    mode: "double",
    metric1Label: "Dakika",
    metric1Unit: "dk",
    metric2Label: "Cumle",
    metric2Unit: "adet",
    supportsCompletedOnly: false,
    ruleJson: presetRules.englishDouble
  },
  {
    id: "completed_only",
    name: "Yaptim/Yapmadim",
    mode: "completed",
    metric1Label: "Tamamlama",
    metric1Unit: "adet",
    supportsCompletedOnly: true,
    ruleJson: presetRules.completedOnly
  }
];

export function getPresetById(id: string) {
  return rulePresets.find((preset) => preset.id === id);
}

export function buildSingleRuleFromThresholds(t5: number, t4: number, t3: number, t2: number): RuleJson {
  return {
    mode: "single",
    metric: "m1",
    missingHandling: "NA",
    levels: {
      "5": { m1: { gte: t5 } },
      "4": { m1: { gte: t4 } },
      "3": { m1: { gte: t3 } },
      "2": { m1: { gte: t2 } },
      "1": { else: true }
    }
  };
}

export function buildDoubleRuleFromThresholds(
  fiveDirect: number,
  fiveM1: number,
  fiveM2: number,
  t4: number,
  t3: number,
  t2: number
): RuleJson {
  return {
    mode: "double",
    missingHandling: "SCORE_1",
    levels: {
      "5": {
        or: [
          { m1: { gte: fiveDirect } },
          { and: [{ m1: { gte: fiveM1 } }, { m2: { gte: fiveM2 } }] }
        ]
      },
      "4": { m1: { gte: t4 } },
      "3": { m1: { gte: t3 } },
      "2": { m1: { gte: t2 } },
      "1": { else: true }
    }
  };
}
