import { randomUUID } from "node:crypto";
import { PrismaClient } from "@prisma/client";
import { hashPassword } from "better-auth/crypto";

const prisma = new PrismaClient();

async function bootstrap() {
  const email = process.env.ADMIN_BOOTSTRAP_EMAIL;
  const name = process.env.ADMIN_BOOTSTRAP_NAME;
  const password = process.env.ADMIN_BOOTSTRAP_PASSWORD;

  if (!email || !name || !password) {
    console.error("Missing bootstrap environment variables.");
    process.exit(1);
  }

  try {
    const normalizedEmail = email.trim().toLowerCase();
    const passwordHash = await hashPassword(password);

    const result = await prisma.$transaction(async (tx) => {
      const users = await tx.user.findMany({ select: { email: true }, take: 2 });
      if (users.length > 0) {
        if (users.length === 1 && users[0].email === normalizedEmail) return "exists" as const;
        throw new Error("Admin lain sudah ada. Bootstrap admin kedua ditolak.");
      }

      const userId = randomUUID();
      await tx.user.create({
        data: {
          id: userId,
          email: normalizedEmail,
          name: name.trim(),
          emailVerified: true,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      });
      await tx.account.create({
        data: {
          id: randomUUID(),
          accountId: userId,
          providerId: "credential",
          userId,
          password: passwordHash,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      });
      return "created" as const;
    });

    if (result === "created") {
      console.log("Admin user bootstrapped successfully.");
      console.log("IMPORTANT: Please remove ADMIN_BOOTSTRAP_PASSWORD from your environment variables.");
    } else {
      console.log("Admin yang sama sudah ada. Bootstrap dilewati.");
    }
  } catch (error: unknown) {
    console.error(error instanceof Error ? error.message : "Bootstrap admin gagal.");
    process.exitCode = 1;
  } finally {
    await prisma.$disconnect();
  }
}

void bootstrap();
