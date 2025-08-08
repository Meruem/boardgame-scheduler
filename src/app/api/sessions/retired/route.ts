import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function GET() {
  try {
    const now = new Date();
    
    // Find sessions where scheduledAt + maxTimeMinutes < current time
    const sessions = await prisma.gameSession.findMany({
      where: {
        scheduledAt: {
          lt: new Date(now.getTime() - 60 * 1000) // Subtract 1 minute to account for maxTimeMinutes
        }
      },
      orderBy: { scheduledAt: "desc" },
      include: { signups: true },
    });

    // Filter sessions that are actually retired (scheduledAt + maxTimeMinutes < now)
    const retiredSessions = sessions.filter(session => {
      const sessionEndTime = new Date(session.scheduledAt.getTime() + session.maxTimeMinutes * 60 * 1000);
      return sessionEndTime < now;
    });

    return NextResponse.json(retiredSessions);
  } catch (error) {
    console.error('Error fetching retired sessions:', error);
    return NextResponse.json(
      { error: "Failed to fetch retired sessions" },
      { status: 500 }
    );
  }
}
