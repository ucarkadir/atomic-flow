import { NextResponse } from "next/server";
import { getAuthContext } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { normalizeDate } from "@/lib/date";

export async function GET(request: Request) {
  const { appUser } = await getAuthContext();
  if (!appUser) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const date = searchParams.get("date");

  if (!date) {
    return NextResponse.json({ error: "date zorunlu" }, { status: 400 });
  }

  const [habits, entries] = await Promise.all([
    prisma.habit.findMany({
      where: { userId: appUser.id },
      orderBy: { createdAt: "asc" }
    }),
    prisma.dailyEntry.findMany({
      where: {
        userId: appUser.id,
        date: normalizeDate(date)
      }
    })
  ]);

  return NextResponse.json({ habits, entries });
}
