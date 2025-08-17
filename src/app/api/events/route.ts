import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const includeFinished = searchParams.get('includeFinished') === 'true';
    
    console.log('API /events called with includeFinished:', includeFinished);
    
    // Try to query with finished field first
    let events;
    try {
      events = await prisma.event.findMany({
        where: includeFinished ? {} : { finished: false },
        orderBy: { createdAt: "desc" },
        include: {
          _count: {
            select: { sessions: true }
          }
        }
      });
    } catch (schemaError) {
      console.warn('Schema error (possibly missing finished field), falling back to basic query:', schemaError);
      // Fallback: if finished field doesn't exist, just return all events
      events = await prisma.event.findMany({
        orderBy: { createdAt: "desc" },
        include: {
          _count: {
            select: { sessions: true }
          }
        }
      });
      // Add finished: false to all events if field doesn't exist
      events = events.map(event => ({ ...event, finished: false }));
    }

    console.log('Events found:', events.length);
    if (includeFinished) {
      console.log('Finished events:', events.filter(e => e.finished).length);
    }
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
