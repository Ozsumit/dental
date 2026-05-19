import { cookies } from "next/headers";
import { SignJWT, jwtVerify } from "jose";

const secretKey = process.env.SESSION_SECRET || "fallback_secret_for_dev_only";
const key = new TextEncoder().encode(secretKey);

import { UserSession } from "../types";

export async function encrypt(payload: UserSession) {
  return await new SignJWT({ ...payload } as unknown as Record<string, unknown>)
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("2h")
    .sign(key);
}

export async function decrypt(input: string): Promise<UserSession> {
  const { payload } = await jwtVerify(input, key, {
    algorithms: ["HS256"],
  });
  return payload as unknown as UserSession;
}

export async function getSession() {
  const session = (await cookies()).get("session")?.value;
  if (!session) return null;
  return await decrypt(session);
}

export async function getTenantIdOrThrow(): Promise<string> {
  const session = await getSession();
  if (!session || !session.tenantId) {
    throw new Error("Unauthorized: No tenant context found.");
  }
  return session.tenantId;
}

export async function getTenantNameOrThrow(): Promise<string> {
  const session = await getSession();
  if (!session || !session.tenantName) {
    throw new Error("Unauthorized: No tenant name found.");
  }
  return session.tenantName;
}

export async function logout() {
  (await cookies()).set("session", "", { expires: new Date(0) });
}
