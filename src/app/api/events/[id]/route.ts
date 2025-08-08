import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function PUT(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;
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

    // If trying to finish an event, check if it has open sessions
    if (finished === true) {
      const eventWithSessions = await prisma.event.findUnique({
        where: { id },
        include: {
          sessions: {
            where: {
              scheduledAt: {
                gte: new Date()
              }
            }
          }
        }
      });

      if (eventWithSessions?.sessions.length > 0) {
        return NextResponse.json(
          { error: "Cannot finish event with open sessions" },
          { status: 400 }
        );
      }
    }

    const updateData: any = {};
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
  } catch (error) {
    console.error('Error updating event:', error);
    if (error.code === 'P2025') {
      return NextResponse.json(
        { error: "Event not found" },
        { status: 404 }
      );
    }
    if (error.code === 'P2002') {
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
  try {
    const { id } = params;

    await prisma.event.delete({
      where: { id },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting event:', error);
    if (error.code === 'P2025') {
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
