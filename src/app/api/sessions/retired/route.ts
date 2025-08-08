import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const eventId = searchParams.get('eventId');
    
    // For now, allow sessions without eventId for backward compatibility
    // In the future, we can make this required

    const now = new Date();
    
    // Find sessions where scheduledAt + maxTimeMinutes < current time for the specified event (if provided)
    // For backward compatibility, also include sessions without eventId when no specific event is selected
    const sessions = await prisma.gameSession.findMany({
      where: {
        ...(eventId ? { eventId } : { eventId: null }),
        scheduledAt: {
          lt: new Date(now.getTime() - 60 * 1000) // Subtract 1 minute to account for maxTimeMinutes
        }
      },
      orderBy: { scheduledAt: "desc" },
      include: { signups: true },
    });

    // Filter sessions that are actually retired (scheduledAt + maxTimeMinutes < now)
    const retiredSessions = sessions.filter(session => {
      if (!session.scheduledAt || !session.maxTimeMinutes) {
        return false; // Sessions without date or max time are never retired
      }
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
