import { cookies } from "next/headers";
import { prisma } from "./db";
import crypto from "crypto";

const SESSION_COOKIE = "coq_session";
const SESSION_EXPIRY = 30 * 24 * 60 * 60 * 1000; // 30 days

export async function hashPassword(password: string): Promise<string> {
  const salt = crypto.randomBytes(16).toString("hex");
  const hash = crypto.pbkdf2Sync(password, salt, 1000, 64, "sha512").toString("hex");
  return `${salt}:${hash}`;
}

export async function verifyPassword(password: string, stored: string): Promise<boolean> {
  const [salt, hash] = stored.split(":");
  const verifyHash = crypto.pbkdf2Sync(password, salt, 1000, 64, "sha512").toString("hex");
  return hash === verifyHash;
}

export async function createSession(userId: string): Promise<string> {
  const token = crypto.randomBytes(32).toString("hex");
  
  (await cookies()).set(SESSION_COOKIE, `${userId}:${token}`, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: SESSION_EXPIRY / 1000,
    path: "/",
  });

  return token;
}

export async function getSession() {
  const cookieStore = await cookies();
  const session = cookieStore.get(SESSION_COOKIE)?.value;
  
  if (!session) return null;

  const [userId] = session.split(":");
  
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      id: true,
      email: true,
      name: true,
      plan: true,
      subscriptionStatus: true,
      stripeCustomerId: true,
    },
  });

  return user;
}

export async function destroySession() {
  (await cookies()).delete(SESSION_COOKIE);
}

export async function requireAuth() {
  const user = await getSession();
  if (!user) {
    throw new Error("Unauthorized");
  }
  return user;
}

export function isPro(user: { plan: string; subscriptionStatus: string }) {
  return user.plan === "pro" && user.subscriptionStatus === "active";
}
