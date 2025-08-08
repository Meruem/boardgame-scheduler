import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function GET() {
  try {
    const sessions = await prisma.gameSession.findMany({
      orderBy: { scheduledAt: "asc" },
      include: { signups: true },
    });
    return NextResponse.json(sessions);
  } catch (error) {
    console.error('Error fetching sessions:', error);
    return NextResponse.json(
      { error: "Failed to fetch sessions" },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    console.log('Received session data:', body);
    const { boardGameName, scheduledAt, maxPlayers, complexity, minTimeMinutes, maxTimeMinutes } = body ?? {};

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
            typeof minTimeMinutes !== "number" ||
            !Number.isInteger(minTimeMinutes) ||
            minTimeMinutes <= 0 ||
            typeof maxTimeMinutes !== "number" ||
            !Number.isInteger(maxTimeMinutes) ||
            maxTimeMinutes <= 0 ||
            maxTimeMinutes < minTimeMinutes
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
                minTimeMinutes,
                maxTimeMinutes,
              },
            });
    return NextResponse.json(created, { status: 201 });
  } catch (error) {
    console.error('Error creating session:', error);
    return NextResponse.json(
      { error: "Failed to create session" },
      { status: 500 }
    );
  }
}


