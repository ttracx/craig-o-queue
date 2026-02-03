import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { createCheckoutSession } from "@/lib/stripe";

export async function POST() {
  try {
    const user = await getSession();
    
    if (!user) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const session = await createCheckoutSession(user.id, user.email);

    return NextResponse.json({ url: session.url });
  } catch (error) {
    console.error("Checkout error:", error);
    return NextResponse.json(
      { error: "Failed to create checkout session" },
      { status: 500 }
    );
  }
}
