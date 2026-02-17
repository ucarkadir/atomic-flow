import test from "node:test";
import assert from "node:assert/strict";
import { calculateScore, scoreForMissingEntry, type RuleJson } from "@/lib/score-engine";

test("single metric scoring works", () => {
  const rule: RuleJson = {
    mode: "single",
    metric: "m1",
    levels: {
      "5": { m1: { gte: 45 } },
      "4": { m1: { gte: 30 } },
      "3": { m1: { gte: 15 } },
      "2": { m1: { gte: 2 } },
      "1": { else: true }
    }
  };

  assert.equal(calculateScore(rule, { metric1Value: 33 }).score, 4);
  assert.equal(calculateScore(rule, { metric1Value: 1 }).score, 1);
});

test("double metric OR/AND scoring works", () => {
  const rule: RuleJson = {
    mode: "double",
    levels: {
      "5": {
        or: [{ m1: { gte: 45 } }, { and: [{ m1: { gte: 30 } }, { m2: { gte: 10 } }] }]
      },
      "4": { m1: { gte: 30 } },
      "1": { else: true }
    }
  };

  assert.equal(calculateScore(rule, { metric1Value: 31, metric2Value: 11 }).score, 5);
  assert.equal(calculateScore(rule, { metric1Value: 31, metric2Value: 0 }).score, 4);
});

test("completed-only scoring works", () => {
  const rule: RuleJson = {
    mode: "completed",
    levels: {
      "5": { completed: true },
      "1": { else: true }
    }
  };

  assert.equal(calculateScore(rule, { completed: true }).score, 5);
  assert.equal(calculateScore(rule, { completed: false }).score, 1);
});

test("lte/eq/between operators work", () => {
  const rule: RuleJson = {
    mode: "single",
    metric: "m1",
    levels: {
      "5": { m1: { between: [10, 20] } },
      "4": { m1: { lte: 9 } },
      "3": { m1: { eq: 25 } },
      "1": { else: true }
    }
  };

  assert.equal(calculateScore(rule, { metric1Value: 15 }).score, 5);
  assert.equal(calculateScore(rule, { metric1Value: 8 }).score, 4);
  assert.equal(calculateScore(rule, { metric1Value: 25 }).score, 3);
});

test("missingHandling and invertScore work", () => {
  const rule: RuleJson = {
    mode: "single",
    metric: "m1",
    missingHandling: "SCORE_2",
    levels: {
      "5": { m1: { gte: 50 } },
      "1": { else: true }
    }
  };

  const result = calculateScore(rule, { metric1Value: null }, true);
  assert.equal(result.usedMissingHandling, true);
  assert.equal(result.score, 4);
});

test("weekly missing entry helper honors NA", () => {
  const ruleNa: RuleJson = {
    mode: "single",
    metric: "m1",
    missingHandling: "NA",
    levels: { "1": { else: true } }
  };

  const rule2: RuleJson = {
    mode: "single",
    metric: "m1",
    missingHandling: "SCORE_2",
    levels: { "1": { else: true } }
  };

  assert.equal(scoreForMissingEntry(ruleNa), null);
  assert.equal(scoreForMissingEntry(rule2), 2);
  assert.equal(scoreForMissingEntry(rule2, true), 4);
});
