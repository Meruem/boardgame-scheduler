import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function PUT(
  request: Request,
  { params }: { params: { id: string } }
) {
  const { id } = params;
  try {
    const body = await request.json();
    const { name, finished } = body ?? {};

    // Validate input
    if (
      (name !== undefined && (typeof name !== "string" || !name.trim())) ||
      (finished !== undefined && typeof finished !== "boolean")
    ) {
      return NextResponse.json(
        { error: "Invalid input" },
        { status: 400 }
      );
    }

    // If trying to finish an event, check if it has open or ongoing sessions
    if (finished === true) {
      const eventWithSessions = await prisma.event.findUnique({
        where: { id },
        include: {
          sessions: {
            select: {
              scheduledAt: true,
              maxTimeMinutes: true,
            },
          },
        },
      });

      const now = new Date();
      const hasOpenOrOngoing = eventWithSessions?.sessions?.some((session) => {
        if (!session.scheduledAt) {
          return false;
        }
        // If duration is known, session ends at scheduledAt + maxTimeMinutes
        if (session.maxTimeMinutes && Number.isInteger(session.maxTimeMinutes) && session.maxTimeMinutes > 0) {
          const endTime = new Date(
            session.scheduledAt.getTime() + session.maxTimeMinutes * 60 * 1000
          );
          return endTime >= now; // still ongoing or in the future
        }
        // Without duration, consider session open only if scheduled in the future
        return session.scheduledAt >= now;
      }) ?? false;

      if (hasOpenOrOngoing) {
        return NextResponse.json(
          { error: "CANNOT_FINISH_EVENT_WITH_OPEN_SESSIONS" },
          { status: 400 }
        );
      }
    }

    const updateData: { name?: string; finished?: boolean } = {};
    if (name !== undefined) {
      updateData.name = name.trim();
    }
    if (finished !== undefined) {
      updateData.finished = finished;
    }

    const updated = await prisma.event.update({
      where: { id },
      data: updateData,
    });

    return NextResponse.json(updated);
  } catch (error: unknown) {
    const prismaError = error as { code?: string };
    console.error('Error updating event:', error);
    if (prismaError.code === 'P2025') {
      return NextResponse.json(
        { error: "Event not found" },
        { status: 404 }
      );
    }
    if (prismaError.code === 'P2002') {
      return NextResponse.json(
        { error: "Event with this name already exists" },
        { status: 400 }
      );
    }
    return NextResponse.json(
      { error: "Failed to update event" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: { id: string } }
) {
  const { id } = params;
  try {

    await prisma.event.delete({
      where: { id },
    });

    return NextResponse.json({ success: true });
  } catch (error: unknown) {
    const prismaError = error as { code?: string };
    console.error('Error deleting event:', error);
    if (prismaError.code === 'P2025') {
      return NextResponse.json(
        { error: "Event not found" },
        { status: 404 }
      );
    }
    return NextResponse.json(
      { error: "Failed to delete event" },
      { status: 500 }
    );
  }
}
