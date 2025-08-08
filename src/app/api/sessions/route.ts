import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function GET() {
  const sessions = await prisma.gameSession.findMany({
    orderBy: { scheduledAt: "asc" },
    include: { signups: true },
  });
  return NextResponse.json(sessions);
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { boardGameName, scheduledAt, maxPlayers, complexity, timeMinutes } = body ?? {};

    if (
      typeof boardGameName !== "string" ||
      !boardGameName.trim() ||
      typeof scheduledAt !== "string" ||
      Number.isNaN(Date.parse(scheduledAt)) ||
      typeof maxPlayers !== "number" ||
      !Number.isInteger(maxPlayers) ||
      maxPlayers <= 0 ||
      typeof complexity !== "number" ||
      complexity < 0 ||
      complexity > 5 ||
      typeof timeMinutes !== "number" ||
      !Number.isInteger(timeMinutes) ||
      timeMinutes <= 0
    ) {
      return NextResponse.json(
        { error: "Invalid input" },
        { status: 400 }
      );
    }

    const created = await prisma.gameSession.create({
      data: {
        boardGameName: boardGameName.trim(),
        scheduledAt: new Date(scheduledAt),
        maxPlayers,
        complexity,
        timeMinutes,
      },
    });
    return NextResponse.json(created, { status: 201 });
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to create session" },
      { status: 500 }
    );
  }
}


