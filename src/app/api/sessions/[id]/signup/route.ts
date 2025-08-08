import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

interface RouteParams {
  params: Promise<{ id: string }>;
}

export async function POST(request: Request, { params }: RouteParams) {
  try {
    const { id } = await params;
    const body = await request.json();
    const { displayName } = body ?? {};

    if (typeof displayName !== "string" || !displayName.trim()) {
      return NextResponse.json(
        { error: "Display name is required" },
        { status: 400 }
      );
    }

    // Check if session exists and get current signups
    const session = await prisma.gameSession.findUnique({
      where: { id },
      include: { signups: true },
    });

    if (!session) {
      return NextResponse.json(
        { error: "Session not found" },
        { status: 404 }
      );
    }

    // Check if session is full
    if (session.signups.length >= session.maxPlayers) {
      return NextResponse.json(
        { error: "Session is full" },
        { status: 400 }
      );
    }

    // Check if user is already signed up
    const existingSignup = session.signups.find(
      (signup) => signup.displayName === displayName.trim()
    );

    if (existingSignup) {
      return NextResponse.json(
        { error: "You are already signed up for this session" },
        { status: 400 }
      );
    }

    // Create the signup
    const signup = await prisma.signup.create({
      data: {
        displayName: displayName.trim(),
        sessionId: id,
      },
    });

    return NextResponse.json(signup, { status: 201 });
  } catch (error) {
    console.error("Signup error:", error);
    return NextResponse.json(
      { error: "Failed to sign up" },
      { status: 500 }
    );
  }
}
