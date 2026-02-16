import { RuleType } from "@prisma/client";
import { presetRules, singleMetricRule } from "@/lib/score-engine";

export const rulePresets: Array<{
  id: string;
  name: string;
  ruleType: RuleType;
  ruleJson: unknown;
}> = [
  {
    id: "pages_basic",
    name: "Sayfa Bazlı (35/28/20/10)",
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
    id: "minutes_basic",
    name: "Dakika Bazlı (45/30/15/2)",
    ruleType: RuleType.SINGLE_METRIC,
    ruleJson: singleMetricRule("minutes", [
      [5, 45],
      [4, 30],
      [3, 15],
      [2, 2],
      [1, 0]
    ])
  },
  {
    id: "english_double",
    name: "İngilizce (45 dk veya 30 dk + output)",
    ruleType: RuleType.DOUBLE_METRIC,
    ruleJson: presetRules.englishDoubleMetric
  },
  {
    id: "minutes_checkbox",
    name: "Dakika + didOutput",
    ruleType: RuleType.CHECKBOX_ASSISTED,
    ruleJson: {
      levels: [
        {
          score: 5,
          any: [
            { all: [{ metric: "minutes", op: "gte", value: 40 }] },
            {
              all: [
                { metric: "minutes", op: "gte", value: 25 },
                { metric: "didOutput", op: "eq", value: true }
              ]
            }
          ]
        },
        { score: 4, any: [{ all: [{ metric: "minutes", op: "gte", value: 25 }] }] },
        { score: 3, any: [{ all: [{ metric: "minutes", op: "gte", value: 15 }] }] },
        { score: 2, any: [{ all: [{ metric: "minutes", op: "gte", value: 5 }] }] },
        { score: 1, any: [{ all: [] }] }
      ]
    }
  }
];

export function getPresetById(presetId: string) {
  return rulePresets.find((preset) => preset.id === presetId);
}
