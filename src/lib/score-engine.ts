export type MetricKey = "minutes" | "pages" | "outputCount" | "didOutput";

export type EntryMetrics = {
  minutes?: number | null;
  pages?: number | null;
  outputCount?: number | null;
  didOutput?: boolean | null;
};

export type Condition = {
  metric: MetricKey;
  op: "gte" | "eq";
  value: number | boolean;
};

export type RuleJson = {
  levels: Array<{
    score: number;
    any: Array<{ all: Condition[] }>;
  }>;
};

export function calculateScore(ruleJson: unknown, metrics: EntryMetrics): number {
  const rule = ruleJson as RuleJson;
  const levels = [...(rule?.levels ?? [])].sort((a, b) => b.score - a.score);

  for (const level of levels) {
    if (!Array.isArray(level.any)) {
      continue;
    }

    const matched = level.any.some((group) =>
      (group.all ?? []).every((condition) => checkCondition(condition, metrics))
    );

    if (matched) {
      return clampScore(level.score);
    }
  }

  return 1;
}

function checkCondition(condition: Condition, metrics: EntryMetrics): boolean {
  const actual = metrics[condition.metric];

  if (condition.op === "eq") {
    return actual === condition.value;
  }

  if (typeof actual !== "number" || typeof condition.value !== "number") {
    return false;
  }

  return actual >= condition.value;
}

function clampScore(score: number): number {
  if (score < 1) {
    return 1;
  }
  if (score > 5) {
    return 5;
  }
  return Math.round(score);
}

export function singleMetricRule(
  metric: "minutes" | "pages" | "outputCount",
  thresholds: Array<[number, number]>
): RuleJson {
  return {
    levels: thresholds.map(([score, min]) => ({
      score,
      any: [{ all: [{ metric, op: "gte", value: min }] }]
    }))
  };
}

export const presetRules = {
  englishDoubleMetric: {
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
  } satisfies RuleJson
};
