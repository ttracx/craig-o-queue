import { NextResponse } from "next/server";
import { getSession, isPro } from "@/lib/auth";
import { prisma } from "@/lib/db";
import crypto from "crypto";

export async function GET() {
  try {
    const user = await getSession();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const webhooks = await prisma.webhook.findMany({
      where: { userId: user.id },
      include: {
        queue: { select: { name: true } },
      },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json({ webhooks });
  } catch (error) {
    console.error("Get webhooks error:", error);
    return NextResponse.json({ error: "Failed to get webhooks" }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const user = await getSession();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (!isPro(user)) {
      return NextResponse.json(
        { error: "Webhooks require Pro plan" },
        { status: 403 }
      );
    }

    const { name, url, queueId, onComplete, onFail, onRetry } = await req.json();

    if (!name || !url) {
      return NextResponse.json({ error: "Name and URL are required" }, { status: 400 });
    }

    // Verify queue ownership if specified
    if (queueId) {
      const queue = await prisma.queue.findFirst({
        where: { id: queueId, userId: user.id },
      });
      if (!queue) {
        return NextResponse.json({ error: "Queue not found" }, { status: 404 });
      }
    }

    const secret = crypto.randomBytes(32).toString("hex");

    const webhook = await prisma.webhook.create({
      data: {
        name,
        url,
        secret,
        queueId,
        userId: user.id,
        onComplete: onComplete ?? true,
        onFail: onFail ?? true,
        onRetry: onRetry ?? false,
      },
    });

    return NextResponse.json({ webhook });
  } catch (error) {
    console.error("Create webhook error:", error);
    return NextResponse.json({ error: "Failed to create webhook" }, { status: 500 });
  }
}
