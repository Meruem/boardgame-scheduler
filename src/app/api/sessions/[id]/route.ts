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
    const { boardGameName, scheduledAt, maxPlayers, complexity, minTimeMinutes, maxTimeMinutes, description, organizer, url } = body ?? {};

    // Validate input
    if (
      typeof boardGameName !== "string" ||
      !boardGameName.trim() ||
      (scheduledAt !== null && scheduledAt !== undefined && (
        typeof scheduledAt !== "string" ||
        Number.isNaN(Date.parse(scheduledAt))
      )) ||
      typeof maxPlayers !== "number" ||
      !Number.isInteger(maxPlayers) ||
      maxPlayers <= 0 ||
      maxPlayers > 100
    ) {
      return NextResponse.json(
        { error: "Invalid input" },
        { status: 400 }
      );
    }

    // Handle optional complexity and time fields
    const finalComplexity = typeof complexity === "number" && complexity >= 0 && complexity <= 5
      ? complexity
      : undefined; // undefined means do not change

    const finalMinTimeMinutes = (typeof minTimeMinutes === "number" && Number.isInteger(minTimeMinutes) && minTimeMinutes > 0)
      ? minTimeMinutes
      : (minTimeMinutes === null ? null : undefined); // allow explicit null to clear

    const finalMaxTimeMinutes = (typeof maxTimeMinutes === "number" && Number.isInteger(maxTimeMinutes) && maxTimeMinutes > 0)
      ? maxTimeMinutes
      : (maxTimeMinutes === null ? null : undefined);

    // Validate that if both times are provided, max is not less than min
    if (
      finalMinTimeMinutes !== undefined && finalMaxTimeMinutes !== undefined &&
      finalMinTimeMinutes !== null && finalMaxTimeMinutes !== null &&
      finalMaxTimeMinutes < finalMinTimeMinutes
    ) {
      return NextResponse.json(
        { error: "Max time cannot be less than min time" },
        { status: 400 }
      );
    }

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

    // Build update payload without unintentionally clearing fields
    const updateData: {
      boardGameName?: string;
      scheduledAt?: Date | null;
      maxPlayers?: number;
      complexity?: number;
      description?: string | null;
      organizer?: string | null;
      url?: string | null;
      minTimeMinutes?: number | null;
      maxTimeMinutes?: number | null;
    } = {};

    updateData.boardGameName = boardGameName.trim();
    updateData.maxPlayers = maxPlayers;

    if (scheduledAt !== undefined) {
      updateData.scheduledAt = scheduledAt ? new Date(scheduledAt) : null;
    }

    if (finalComplexity !== undefined) {
      updateData.complexity = finalComplexity;
    }

    if (description !== undefined) {
      updateData.description = description === null ? null : description?.trim() || null;
    }

    if (organizer !== undefined) {
      updateData.organizer = organizer === null ? null : organizer?.trim() || null;
    }

    if (url !== undefined) {
      updateData.url = url === null ? null : url?.trim() || null;
    }

    if (finalMinTimeMinutes !== undefined) {
      updateData.minTimeMinutes = finalMinTimeMinutes;
    }
    if (finalMaxTimeMinutes !== undefined) {
      updateData.maxTimeMinutes = finalMaxTimeMinutes;
    }

    const updated = await prisma.gameSession.update({
      where: { id },
      data: updateData,
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
