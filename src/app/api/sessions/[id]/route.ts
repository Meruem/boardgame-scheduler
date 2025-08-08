import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

interface RouteParams {
  params: { id: string };
}

export async function GET(_request: Request, context: RouteParams) {
  const { id } = await context.params;
  const session = await prisma.gameSession.findUnique({
    where: { id },
    include: { signups: true },
  });

  if (!session) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  return NextResponse.json(session);
}

export async function PUT(request: Request, context: RouteParams) {
  try {
    const { id } = await context.params;
    const body = await request.json();
    console.log('Update session request body:', body);
    const { boardGameName, scheduledAt, maxPlayers, complexity, timeMinutes } = body ?? {};

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

    // Handle optional complexity and timeMinutes with defaults
    const finalComplexity = typeof complexity === "number" && complexity >= 0 && complexity <= 5 
      ? complexity 
      : 2.0;
    
    const finalTimeMinutes = typeof timeMinutes === "number" && Number.isInteger(timeMinutes) && timeMinutes > 0
      ? timeMinutes
      : 60;

    console.log('Final values:', { finalComplexity, finalTimeMinutes });

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
      timeMinutes: finalTimeMinutes,
    });

    const updated = await prisma.gameSession.update({
      where: { id },
      data: {
        boardGameName: boardGameName.trim(),
        scheduledAt: new Date(scheduledAt),
        maxPlayers,
        complexity: finalComplexity,
        timeMinutes: finalTimeMinutes,
      },
      include: { signups: true },
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

export async function DELETE(_request: Request, context: RouteParams) {
  try {
    const { id } = await context.params;
    
    // Check if session exists
    const session = await prisma.gameSession.findUnique({
      where: { id },
      include: { signups: true },
    });

    if (!session) {
      return NextResponse.json({ error: "Session not found" }, { status: 404 });
    }

    // Delete the session (signups will be deleted automatically due to cascade)
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


