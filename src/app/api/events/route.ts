import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const includeFinished = searchParams.get('includeFinished') === 'true';
    
    const events = await prisma.event.findMany({
      where: includeFinished ? {} : { finished: false },
      orderBy: { createdAt: "desc" },
      include: {
        _count: {
          select: { sessions: true }
        }
      }
    });

    console.log('Events with counts:', events);
    return NextResponse.json(events);
  } catch (error) {
    console.error('Error fetching events:', error);
    return NextResponse.json(
      { error: "Failed to fetch events" },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { name } = body ?? {};

    // Validate input
    if (
      typeof name !== "string" ||
      !name.trim()
    ) {
      return NextResponse.json(
        { error: "Event name is required" },
        { status: 400 }
      );
    }

    const created = await prisma.event.create({
      data: {
        name: name.trim(),
      },
    });

    return NextResponse.json(created, { status: 201 });
  } catch (error: unknown) {
    const prismaError = error as { code?: string };
    console.error('Error creating event:', error);
    if (prismaError.code === 'P2002') {
      return NextResponse.json(
        { error: "Event with this name already exists" },
        { status: 400 }
      );
    }
    return NextResponse.json(
      { error: "Failed to create event" },
      { status: 500 }
    );
  }
}
