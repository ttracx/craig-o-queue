import { NextResponse } from "next/server";
import { getSession, isPro } from "@/lib/auth";
import { prisma } from "@/lib/db";

export async function GET() {
  try {
    const user = await getSession();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const queues = await prisma.queue.findMany({
      where: { userId: user.id },
      include: {
        _count: {
          select: { jobs: true },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json({ queues });
  } catch (error) {
    console.error("Get queues error:", error);
    return NextResponse.json({ error: "Failed to get queues" }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const user = await getSession();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { name, description, maxRetries, retryDelay } = await req.json();

    if (!name) {
      return NextResponse.json({ error: "Name is required" }, { status: 400 });
    }

    // Check limits for free users
    if (!isPro(user)) {
      const queueCount = await prisma.queue.count({
        where: { userId: user.id },
      });
      if (queueCount >= 1) {
        return NextResponse.json(
          { error: "Free plan limited to 1 queue. Upgrade to Pro for unlimited queues." },
          { status: 403 }
        );
      }
    }

    const queue = await prisma.queue.create({
      data: {
        name,
        description,
        userId: user.id,
        maxRetries: maxRetries ?? 3,
        retryDelay: retryDelay ?? 60000,
      },
    });

    return NextResponse.json({ queue });
  } catch (error) {
    console.error("Create queue error:", error);
    return NextResponse.json({ error: "Failed to create queue" }, { status: 500 });
  }
}
