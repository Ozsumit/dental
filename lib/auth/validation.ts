import prisma from "@/lib/prisma";

export async function validateGlobalUsername(username: string, userId?: string) {
  if (!username || !username.trim()) {
    throw new Error("Username is required.");
  }

  const duplicate = await prisma.user.findFirst({
    where: {
      username: username.trim(),
      NOT: userId ? { id: userId } : undefined,
    },
  });

  if (duplicate) {
    throw new Error("Username is already taken by another user.");
  }
}
