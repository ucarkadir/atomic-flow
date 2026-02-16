-- CreateEnum
CREATE TYPE "RuleType" AS ENUM ('SINGLE_METRIC', 'DOUBLE_METRIC', 'CHECKBOX_ASSISTED');

-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "supabaseUserId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Habit" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "habitName" TEXT NOT NULL,
    "identityStatement" TEXT NOT NULL,
    "implementationIntention" TEXT NOT NULL,
    "habitStacking" TEXT NOT NULL,
    "trackingStacking" TEXT NOT NULL,
    "weeklyTargetText" TEXT NOT NULL,
    "ruleType" "RuleType" NOT NULL,
    "ruleJson" JSONB NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Habit_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DailyEntry" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "habitId" TEXT NOT NULL,
    "date" TIMESTAMP(3) NOT NULL,
    "minutes" INTEGER,
    "pages" INTEGER,
    "outputCount" INTEGER,
    "didOutput" BOOLEAN,
    "score" INTEGER NOT NULL,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "DailyEntry_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "HabitSchedule" (
    "id" TEXT NOT NULL,
    "habitId" TEXT NOT NULL,
    "weekday" INTEGER NOT NULL,
    "isPlanned" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "HabitSchedule_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_supabaseUserId_key" ON "User"("supabaseUserId");

-- CreateIndex
CREATE INDEX "Habit_userId_createdAt_idx" ON "Habit"("userId", "createdAt");

-- CreateIndex
CREATE INDEX "DailyEntry_userId_date_idx" ON "DailyEntry"("userId", "date");

-- CreateIndex
CREATE UNIQUE INDEX "DailyEntry_userId_habitId_date_key" ON "DailyEntry"("userId", "habitId", "date");

-- CreateIndex
CREATE INDEX "HabitSchedule_habitId_weekday_idx" ON "HabitSchedule"("habitId", "weekday");

-- CreateIndex
CREATE UNIQUE INDEX "HabitSchedule_habitId_weekday_key" ON "HabitSchedule"("habitId", "weekday");

-- AddForeignKey
ALTER TABLE "Habit" ADD CONSTRAINT "Habit_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DailyEntry" ADD CONSTRAINT "DailyEntry_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DailyEntry" ADD CONSTRAINT "DailyEntry_habitId_fkey" FOREIGN KEY ("habitId") REFERENCES "Habit"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "HabitSchedule" ADD CONSTRAINT "HabitSchedule_habitId_fkey" FOREIGN KEY ("habitId") REFERENCES "Habit"("id") ON DELETE CASCADE ON UPDATE CASCADE;
