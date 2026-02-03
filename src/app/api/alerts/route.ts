import { NextResponse } from "next/server";
import { getSession, isPro } from "@/lib/auth";
import { prisma } from "@/lib/db";

export async function GET() {
  try {
    const user = await getSession();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const alerts = await prisma.alert.findMany({
      where: { userId: user.id },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json({ alerts });
  } catch (error) {
    console.error("Get alerts error:", error);
    return NextResponse.json({ error: "Failed to get alerts" }, { status: 500 });
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
        { error: "Failure alerts require Pro plan" },
        { status: 403 }
      );
    }

    const { type, channel, destination, threshold, windowMinutes } = await req.json();

    if (!type || !channel || !destination) {
      return NextResponse.json({ error: "Type, channel, and destination are required" }, { status: 400 });
    }

    const alert = await prisma.alert.create({
      data: {
        type,
        channel,
        destination,
        threshold: threshold ?? 1,
        windowMinutes: windowMinutes ?? 60,
        userId: user.id,
      },
    });

    return NextResponse.json({ alert });
  } catch (error) {
    console.error("Create alert error:", error);
    return NextResponse.json({ error: "Failed to create alert" }, { status: 500 });
  }
}
