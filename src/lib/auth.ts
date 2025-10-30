// src/lib/auth.ts
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/options"; // wherever you defined it
import { Session } from "next-auth";

export async function getAuthSession(): Promise<Session | null> {
  return await getServerSession(authOptions);
}
