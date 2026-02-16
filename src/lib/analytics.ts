import { addDays } from "date-fns";

export type HabitLite = {
  id: string;
  habitName: string;
  schedules: Array<{ weekday: number; isPlanned: boolean }>;
};

export type EntryLite = {
  id: string;
  habitId: string;
  date: Date;
  score: number;
};

export type WeeklyHabitRow = {
  habitId: string;
  habitName: string;
  days: Array<{ date: string; score: number | null; planned: boolean }>;
  filledDays: number;
  totalScore: number;
  average: number;
  percent: number;
};

export type WeeklySummary = {
  rows: WeeklyHabitRow[];
  overall: {
    filledDays: number;
    totalScore: number;
    average: number;
    percent: number;
  };
};

export function buildWeeklySummary(
  habits: HabitLite[],
  entries: EntryLite[],
  weekStart: Date
): WeeklySummary {
  const days = Array.from({ length: 7 }, (_, i) => addDays(weekStart, i));

  const rows = habits.map((habit) => {
    const scheduleMap = new Map(habit.schedules.map((s) => [s.weekday, s.isPlanned]));

    const dayCells = days.map((day) => {
      const weekday = day.getUTCDay();
      const planned = scheduleMap.size === 0 ? true : (scheduleMap.get(weekday) ?? false);
      const entry = entries.find(
        (e) => e.habitId === habit.id && sameUtcDate(e.date, day)
      );

      return {
        date: day.toISOString().slice(0, 10),
        score: entry?.score ?? null,
        planned
      };
    });

    const scoredDays = dayCells.filter((day) => typeof day.score === "number");
    const totalScore = scoredDays.reduce((acc, day) => acc + (day.score ?? 0), 0);
    const filledDays = scoredDays.length;
    const average = filledDays ? totalScore / filledDays : 0;
    const percent = filledDays ? (totalScore / (5 * filledDays)) * 100 : 0;

    return {
      habitId: habit.id,
      habitName: habit.habitName,
      days: dayCells,
      filledDays,
      totalScore,
      average,
      percent
    };
  });

  const overallFilledDays = rows.reduce((acc, row) => acc + row.filledDays, 0);
  const overallTotalScore = rows.reduce((acc, row) => acc + row.totalScore, 0);

  return {
    rows,
    overall: {
      filledDays: overallFilledDays,
      totalScore: overallTotalScore,
      average: overallFilledDays ? overallTotalScore / overallFilledDays : 0,
      percent: overallFilledDays ? (overallTotalScore / (5 * overallFilledDays)) * 100 : 0
    }
  };
}

function sameUtcDate(a: Date, b: Date): boolean {
  return (
    a.getUTCFullYear() === b.getUTCFullYear() &&
    a.getUTCMonth() === b.getUTCMonth() &&
    a.getUTCDate() === b.getUTCDate()
  );
}
