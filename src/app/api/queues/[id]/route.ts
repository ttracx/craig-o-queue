import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/db";

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getSession();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;

    const queue = await prisma.queue.findFirst({
      where: { id, userId: user.id },
      include: {
        _count: {
          select: { jobs: true },
        },
        jobs: {
          take: 10,
          orderBy: { createdAt: "desc" },
        },
      },
    });

    if (!queue) {
      return NextResponse.json({ error: "Queue not found" }, { status: 404 });
    }

    return NextResponse.json({ queue });
  } catch (error) {
    console.error("Get queue error:", error);
    return NextResponse.json({ error: "Failed to get queue" }, { status: 500 });
  }
}

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getSession();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    const { name, description, isPaused, maxRetries, retryDelay } = await req.json();

    const queue = await prisma.queue.updateMany({
      where: { id, userId: user.id },
      data: {
        ...(name && { name }),
        ...(description !== undefined && { description }),
        ...(isPaused !== undefined && { isPaused }),
        ...(maxRetries !== undefined && { maxRetries }),
        ...(retryDelay !== undefined && { retryDelay }),
      },
    });

    if (queue.count === 0) {
      return NextResponse.json({ error: "Queue not found" }, { status: 404 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Update queue error:", error);
    return NextResponse.json({ error: "Failed to update queue" }, { status: 500 });
  }
}

export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getSession();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;

    const queue = await prisma.queue.deleteMany({
      where: { id, userId: user.id },
    });

    if (queue.count === 0) {
      return NextResponse.json({ error: "Queue not found" }, { status: 404 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Delete queue error:", error);
    return NextResponse.json({ error: "Failed to delete queue" }, { status: 500 });
  }
}
