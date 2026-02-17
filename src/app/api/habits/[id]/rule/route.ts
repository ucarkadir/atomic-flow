import { NextResponse } from "next/server";
import { getAuthContext } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { appUser } = await getAuthContext();
  if (!appUser) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;

  const habit = await prisma.habit.findFirst({
    where: { id, userId: appUser.id },
    select: {
      id: true,
      habitName: true,
      metric1Label: true,
      metric1Unit: true,
      metric2Label: true,
      metric2Unit: true,
      supportsCompletedOnly: true,
      invertScore: true,
      ruleJson: true
    }
  });

  if (!habit) {
    return NextResponse.json({ error: "Habit bulunamadi" }, { status: 404 });
  }

  return NextResponse.json(habit);
}
