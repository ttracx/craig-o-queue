import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { generateApiKey } from "@/lib/utils";

export async function GET() {
  try {
    const user = await getSession();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const keys = await prisma.apiKey.findMany({
      where: { userId: user.id },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json({ keys });
  } catch (error) {
    console.error("Get API keys error:", error);
    return NextResponse.json({ error: "Failed to get API keys" }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const user = await getSession();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { name } = await req.json();

    if (!name) {
      return NextResponse.json({ error: "Name is required" }, { status: 400 });
    }

    const key = generateApiKey();

    const apiKey = await prisma.apiKey.create({
      data: {
        name,
        key,
        userId: user.id,
      },
    });

    return NextResponse.json({ key: apiKey });
  } catch (error) {
    console.error("Create API key error:", error);
    return NextResponse.json({ error: "Failed to create API key" }, { status: 500 });
  }
}
