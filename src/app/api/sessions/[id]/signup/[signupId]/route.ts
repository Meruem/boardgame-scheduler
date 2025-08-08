import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

interface RouteParams {
  params: Promise<{ id: string; signupId: string }>;
}

export async function DELETE(_request: Request, { params }: RouteParams) {
  try {
    const { id: sessionId, signupId } = await params;
    
    // Check if session exists
    const session = await prisma.gameSession.findUnique({
      where: { id: sessionId },
      include: { signups: true },
    });

    if (!session) {
      return NextResponse.json({ error: "Session not found" }, { status: 404 });
    }

    // Check if signup exists
    const signup = await prisma.signup.findUnique({
      where: { id: signupId },
    });

    if (!signup) {
      return NextResponse.json({ error: "Signup not found" }, { status: 404 });
    }

    // Verify the signup belongs to this session
    if (signup.sessionId !== sessionId) {
      return NextResponse.json({ error: "Signup does not belong to this session" }, { status: 400 });
    }

    // Delete the signup
    await prisma.signup.delete({
      where: { id: signupId },
    });

    // Return the updated session with remaining signups
    const updatedSession = await prisma.gameSession.findUnique({
      where: { id: sessionId },
      include: { signups: true },
    });

    return NextResponse.json(updatedSession);
  } catch (error) {
    console.error("Delete signup error:", error);
    return NextResponse.json(
      { error: "Failed to delete signup" },
      { status: 500 }
    );
  }
}
