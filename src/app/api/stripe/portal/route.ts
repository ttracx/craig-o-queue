import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { createCustomerPortalSession } from "@/lib/stripe";

export async function POST() {
  try {
    const user = await getSession();
    
    if (!user) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    if (!user.stripeCustomerId) {
      return NextResponse.json(
        { error: "No subscription found" },
        { status: 400 }
      );
    }

    const session = await createCustomerPortalSession(user.stripeCustomerId);

    return NextResponse.json({ url: session.url });
  } catch (error) {
    console.error("Portal error:", error);
    return NextResponse.json(
      { error: "Failed to create portal session" },
      { status: 500 }
    );
  }
}
