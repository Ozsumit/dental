import bcrypt from "bcryptjs";
import { Prisma } from "@prisma/client";
import { cookies } from "next/headers";

import { encrypt, getSession } from "@/lib/auth/session";
import { validateGlobalUsername } from "@/lib/auth/validation";
import type { UserSession } from "@/lib/types";

/**
 * Returns the active session or a standard unauthorized error payload.
 */
export async function requireUserSession() {
  const session = await getSession();

  if (!session) {
    return { error: "Unauthorized" } as const;
  }

  return { session } as const;
}

/**
 * Ensures a changed username remains globally unique.
 */
export async function validateUsernameChange(
  username: string,
  session: UserSession,
) {
  if (!username || username === session.username) {
    return;
  }

  await validateGlobalUsername(username, session.id);
}

/**
 * Converts a date input string into a valid Date or null.
 */
export function parseOptionalDate(dateValue: string): Date | null {
  if (!dateValue) {
    return null;
  }

  const parsedDate = new Date(dateValue);
  return Number.isNaN(parsedDate.getTime()) ? null : parsedDate;
}

/**
 * Refreshes the session cookie after a profile change so the UI updates instantly.
 */
export async function refreshSessionProfile(
  session: UserSession,
  updates: {
    username?: string;
    fullName?: string | null;
  },
) {
  const expires = new Date(Date.now() + 2 * 60 * 60 * 1000);
  const updatedSession = await encrypt({
    ...session,
    username: updates.username || session.username,
    fullName: updates.fullName ?? null,
    expires,
  });

  (await cookies()).set("session", updatedSession, {
    expires,
    httpOnly: true,
  });
}

/**
 * Builds the password / OTP payload for security updates.
 */
export async function createSecurityUpdateData(
  newPassword: string,
  requireOtp: boolean,
): Promise<Prisma.UserUpdateInput> {
  const updateData: Prisma.UserUpdateInput = { requireOtp };

  if (newPassword) {
    updateData.password = await bcrypt.hash(newPassword, 10);
  }

  return updateData;
}

/**
 * Normalizes unknown thrown values into a user-facing message.
 */
export function getErrorMessage(
  error: unknown,
  fallbackMessage: string,
): string {
  if (error instanceof Error && error.message) {
    return error.message;
  }

  return fallbackMessage;
}
