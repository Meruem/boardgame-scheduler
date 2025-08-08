import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const eventId = searchParams.get('eventId');
    
    // For now, allow sessions without eventId for backward compatibility
    // In the future, we can make this required

    const now = new Date();
    
    // Get all sessions for the specified event (if provided)
    // For backward compatibility, also include sessions without eventId when no specific event is selected
    const sessions = await prisma.gameSession.findMany({
      where: eventId ? { eventId } : { eventId: null },
      orderBy: { scheduledAt: "asc" },
      include: { signups: true },
    });

    // Filter out retired sessions (scheduledAt + maxTimeMinutes < now)
    // Sessions without scheduledAt or maxTimeMinutes never expire
    const activeSessions = sessions.filter(session => {
      if (!session.scheduledAt || !session.maxTimeMinutes) {
        return true; // Sessions without date or max time never expire
      }
      const sessionEndTime = new Date(session.scheduledAt.getTime() + session.maxTimeMinutes * 60 * 1000);
      return sessionEndTime >= now;
    });

    console.log('Sessions API response:', { eventId, totalSessions: sessions.length, activeSessions: activeSessions.length });
    return NextResponse.json(activeSessions);
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
    const { boardGameName, scheduledAt, maxPlayers, complexity, minTimeMinutes, maxTimeMinutes, description, organizer, url, eventId } = body ?? {};
    console.log('Received session data with eventId:', { eventId, boardGameName });

          if (
            typeof boardGameName !== "string" ||
            !boardGameName.trim() ||
            (eventId !== null && eventId !== undefined && (
              typeof eventId !== "string" ||
              !eventId.trim()
            )) ||
            (scheduledAt !== null && scheduledAt !== undefined && (
              typeof scheduledAt !== "string" ||
              Number.isNaN(Date.parse(scheduledAt))
            )) ||
            typeof maxPlayers !== "number" ||
            !Number.isInteger(maxPlayers) ||
            maxPlayers <= 0 ||
            maxPlayers > 100 ||
                              typeof complexity !== "number" ||
                  complexity < 0 ||
                  complexity > 5 ||
                  (minTimeMinutes !== null && minTimeMinutes !== undefined && (
                    typeof minTimeMinutes !== "number" ||
                    !Number.isInteger(minTimeMinutes) ||
                    minTimeMinutes <= 0
                  )) ||
                  (maxTimeMinutes !== null && maxTimeMinutes !== undefined && (
                    typeof maxTimeMinutes !== "number" ||
                    !Number.isInteger(maxTimeMinutes) ||
                    maxTimeMinutes <= 0
                  )) ||
                  (minTimeMinutes !== null && minTimeMinutes !== undefined && 
                   maxTimeMinutes !== null && maxTimeMinutes !== undefined && 
                   maxTimeMinutes < minTimeMinutes)
          ) {
      return NextResponse.json(
        { error: "Invalid input" },
        { status: 400 }
      );
    }

                                const created = await prisma.gameSession.create({
                  data: {
                    boardGameName: boardGameName.trim(),
                    scheduledAt: scheduledAt ? new Date(scheduledAt) : null,
                    maxPlayers,
                    complexity,
                    minTimeMinutes: minTimeMinutes || null,
                    maxTimeMinutes: maxTimeMinutes || null,
                    description: description?.trim() || null,
                    organizer: organizer?.trim() || 'Unknown Organizer',
                    url: url?.trim() || null,
                    eventId: eventId?.trim() || null,
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


