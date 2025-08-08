import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

interface RouteParams {
  params: Promise<{ id: string; commentId: string }>;
}

// DELETE /api/sessions/[id]/comments/[commentId] - Delete a comment
export async function DELETE(_request: Request, { params }: RouteParams) {
  try {
    const { id: sessionId, commentId } = await params;

    // Check if comment exists and belongs to the session
    const comment = await prisma.comment.findFirst({
      where: {
        id: commentId,
        sessionId: sessionId,
      },
    });

    if (!comment) {
      return NextResponse.json({ error: "Comment not found" }, { status: 404 });
    }

    // Delete the comment
    await prisma.comment.delete({
      where: { id: commentId },
    });

    return NextResponse.json({ message: "Comment deleted successfully" });
  } catch (error) {
    console.error("Error deleting comment:", error);
    return NextResponse.json({ error: "Failed to delete comment" }, { status: 500 });
  }
}
