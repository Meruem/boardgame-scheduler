import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

interface RouteParams {
  params: Promise<{ id: string }>;
}

export async function GET(_request: Request, { params }: RouteParams) {
  const { id } = await params;
  const session = await prisma.gameSession.findUnique({
    where: { id },
    include: { signups: true },
  });

  if (!session) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  return NextResponse.json(session);
}

export async function PUT(request: Request, { params }: RouteParams) {
  try {
    const { id } = await params;
    const body = await request.json();
    console.log('Update session request body:', body);
              const { boardGameName, scheduledAt, maxPlayers, complexity, minTimeMinutes, maxTimeMinutes, description } = body ?? {};

    // Validate input
    if (
      typeof boardGameName !== "string" ||
      !boardGameName.trim() ||
      typeof scheduledAt !== "string" ||
      Number.isNaN(Date.parse(scheduledAt)) ||
      typeof maxPlayers !== "number" ||
      !Number.isInteger(maxPlayers) ||
      maxPlayers <= 0
    ) {
      return NextResponse.json(
        { error: "Invalid input" },
        { status: 400 }
      );
    }

              // Handle optional complexity and time fields with defaults
          const finalComplexity = typeof complexity === "number" && complexity >= 0 && complexity <= 5
            ? complexity
            : 2.0;

          const finalMinTimeMinutes = typeof minTimeMinutes === "number" && Number.isInteger(minTimeMinutes) && minTimeMinutes > 0
            ? minTimeMinutes
            : 60;

          const finalMaxTimeMinutes = typeof maxTimeMinutes === "number" && Number.isInteger(maxTimeMinutes) && maxTimeMinutes > 0
            ? maxTimeMinutes
            : 60;

          // Ensure max time is not less than min time
          const adjustedMaxTime = Math.max(finalMinTimeMinutes, finalMaxTimeMinutes);

          console.log('Final values:', { finalComplexity, finalMinTimeMinutes, adjustedMaxTime });

    // Check if session exists and get current signups
    const session = await prisma.gameSession.findUnique({
      where: { id },
      include: { signups: true },
    });

    if (!session) {
      return NextResponse.json({ error: "Session not found" }, { status: 404 });
    }

    // Validate that maxPlayers is not less than current signups
    if (maxPlayers < session.signups.length) {
      return NextResponse.json(
        { error: `Cannot reduce max players below current signups (${session.signups.length})` },
        { status: 400 }
      );
    }

    // Update the session
              console.log('Attempting to update session with data:', {
            id,
            boardGameName: boardGameName.trim(),
            scheduledAt: new Date(scheduledAt),
            maxPlayers,
            complexity: finalComplexity,
            minTimeMinutes: finalMinTimeMinutes,
            maxTimeMinutes: adjustedMaxTime,
            description: description?.trim() || null,
          });

          const updated = await prisma.gameSession.update({
            where: { id },
            data: {
              boardGameName: boardGameName.trim(),
              scheduledAt: new Date(scheduledAt),
              maxPlayers,
              complexity: finalComplexity,
              minTimeMinutes: finalMinTimeMinutes,
              maxTimeMinutes: adjustedMaxTime,
              description: description?.trim() || null,
            },
          });

          console.log('Update successful:', updated);

          return NextResponse.json(updated);
        } catch (error) {
          console.error("Update session error:", error);
          return NextResponse.json(
            { error: "Failed to update session" },
            { status: 500 }
          );
        }
      }

      export async function DELETE(_request: Request, { params }: RouteParams) {
        try {
          const { id } = await params;
          
          // Check if session exists
          const session = await prisma.gameSession.findUnique({
            where: { id },
          });

          if (!session) {
            return NextResponse.json({ error: "Session not found" }, { status: 404 });
          }

          // Delete the session (this will cascade delete signups and comments)
          await prisma.gameSession.delete({
            where: { id },
          });

          return NextResponse.json({ message: "Session deleted successfully" });
        } catch (error) {
          console.error("Delete session error:", error);
          return NextResponse.json(
            { error: "Failed to delete session" },
            { status: 500 }
          );
        }
      }


