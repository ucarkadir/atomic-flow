export type MissingHandling = "NA" | "SCORE_1" | "SCORE_2" | "SCORE_3" | "SCORE_4" | "SCORE_5";

export type MetricCompare = {
  gte?: number;
  lte?: number;
  eq?: number;
  between?: [number, number];
};

export type RuleExpr =
  | { else: true }
  | { completed: boolean }
  | { m1: MetricCompare }
  | { m2: MetricCompare }
  | { and: RuleExpr[] }
  | { or: RuleExpr[] };

export type RuleJson = {
  mode: "single" | "double" | "completed";
  metric?: "m1" | "m2";
  missingHandling?: MissingHandling;
  levels: Partial<Record<"1" | "2" | "3" | "4" | "5", RuleExpr>>;
};

export type ScoreInput = {
  metric1Value?: number | null;
  metric2Value?: number | null;
  completed?: boolean | null;
};

export type ScoreResult = {
  score: number;
  usedMissingHandling: boolean;
};

export function calculateScore(ruleJson: unknown, input: ScoreInput, invertScore = false): ScoreResult {
  const rule = ruleJson as RuleJson;
  const context = {
    m1: toNullableNumber(input.metric1Value),
    m2: toNullableNumber(input.metric2Value),
    completed: typeof input.completed === "boolean" ? input.completed : null
  };

  let sawMissing = false;

  for (const score of [5, 4, 3, 2, 1]) {
    const expr = rule?.levels?.[String(score) as keyof RuleJson["levels"]];
    if (!expr) {
      continue;
    }

    const result = evaluate(expr, context);
    if (result.matched) {
      if (isElseExpression(expr) && sawMissing) {
        continue;
      }
      return {
        score: finalizeScore(score, invertScore),
        usedMissingHandling: false
      };
    }
    sawMissing = sawMissing || result.missing;
  }

  if (sawMissing) {
    const fallback = fallbackScoreFromMissingHandling(rule?.missingHandling);
    return {
      score: finalizeScore(fallback, invertScore),
      usedMissingHandling: true
    };
  }

  return {
    score: finalizeScore(1, invertScore),
    usedMissingHandling: false
  };
}

function isElseExpression(expr: RuleExpr): boolean {
  return typeof expr === "object" && expr !== null && "else" in expr && expr.else === true;
}

export function fallbackScoreFromMissingHandling(missingHandling: MissingHandling | undefined): number {
  if (!missingHandling || missingHandling === "NA") {
    return 1;
  }

  const parsed = Number(missingHandling.replace("SCORE_", ""));
  if (!Number.isFinite(parsed)) {
    return 1;
  }
  return clampScore(parsed);
}

export function scoreForMissingEntry(ruleJson: unknown, invertScore = false): number | null {
  const rule = ruleJson as RuleJson;
  const missingHandling = rule?.missingHandling;

  if (!missingHandling || missingHandling === "NA") {
    return null;
  }

  return finalizeScore(fallbackScoreFromMissingHandling(missingHandling), invertScore);
}

function evaluate(
  expr: RuleExpr,
  context: { m1: number | null; m2: number | null; completed: boolean | null }
): { matched: boolean; missing: boolean } {
  if ("else" in expr) {
    return { matched: expr.else === true, missing: false };
  }

  if ("completed" in expr) {
    if (context.completed === null) {
      return { matched: false, missing: true };
    }
    return { matched: context.completed === expr.completed, missing: false };
  }

  if ("m1" in expr) {
    return compareMetric(context.m1, expr.m1);
  }

  if ("m2" in expr) {
    return compareMetric(context.m2, expr.m2);
  }

  if ("and" in expr) {
    let anyMissing = false;
    for (const item of expr.and) {
      const child = evaluate(item, context);
      if (!child.matched) {
        return { matched: false, missing: anyMissing || child.missing };
      }
      anyMissing = anyMissing || child.missing;
    }
    return { matched: true, missing: anyMissing };
  }

  if ("or" in expr) {
    let anyMissing = false;
    for (const item of expr.or) {
      const child = evaluate(item, context);
      if (child.matched) {
        return { matched: true, missing: anyMissing || child.missing };
      }
      anyMissing = anyMissing || child.missing;
    }
    return { matched: false, missing: anyMissing };
  }

  return { matched: false, missing: false };
}

function compareMetric(actual: number | null, compare: MetricCompare): { matched: boolean; missing: boolean } {
  if (actual === null) {
    return { matched: false, missing: true };
  }

  if (typeof compare.gte === "number" && actual < compare.gte) {
    return { matched: false, missing: false };
  }

  if (typeof compare.lte === "number" && actual > compare.lte) {
    return { matched: false, missing: false };
  }

  if (typeof compare.eq === "number" && actual !== compare.eq) {
    return { matched: false, missing: false };
  }

  if (compare.between) {
    const [min, max] = compare.between;
    if (actual < min || actual > max) {
      return { matched: false, missing: false };
    }
  }

  return { matched: true, missing: false };
}

function toNullableNumber(value: number | null | undefined): number | null {
  if (typeof value !== "number" || !Number.isFinite(value)) {
    return null;
  }
  return value;
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

function finalizeScore(score: number, invertScore: boolean): number {
  const clamped = clampScore(score);
  return invertScore ? 6 - clamped : clamped;
}

export const presetRules = {
  readingPages: {
    mode: "single",
    metric: "m1",
    missingHandling: "NA",
    levels: {
      "5": { m1: { gte: 35 } },
      "4": { m1: { gte: 28 } },
      "3": { m1: { gte: 20 } },
      "2": { m1: { gte: 10 } },
      "1": { else: true }
    }
  } satisfies RuleJson,
  englishDouble: {
    mode: "double",
    missingHandling: "SCORE_1",
    levels: {
      "5": {
        or: [
          { m1: { gte: 45 } },
          {
            and: [{ m1: { gte: 30 } }, { m2: { gte: 10 } }]
          }
        ]
      },
      "4": { m1: { gte: 30 } },
      "3": { m1: { gte: 15 } },
      "2": { m1: { gte: 2 } },
      "1": { else: true }
    }
  } satisfies RuleJson,
  completedOnly: {
    mode: "completed",
    missingHandling: "SCORE_1",
    levels: {
      "5": { completed: true },
      "1": { else: true }
    }
  } satisfies RuleJson
};
