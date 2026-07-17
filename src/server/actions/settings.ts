"use server";

import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { requireAdmin } from "@/server/auth";
import { prisma } from "@/lib/prisma";
import { z } from "zod";
import { revalidatePath } from "next/cache";

const ChangePasswordSchema = z.object({
  currentPassword: z.string().min(1, "Password saat ini wajib diisi"),
  newPassword: z.string().min(8, "Password baru minimal 8 karakter"),
  revokeOtherSessions: z.boolean().default(true),
});

export async function changePasswordAction(data: z.infer<typeof ChangePasswordSchema>) {
  const session = await requireAdmin();
  
  const parsed = ChangePasswordSchema.safeParse(data);
  if (!parsed.success) {
    return { success: false, error: "Data tidak valid" };
  }

  try {
    await auth.api.changePassword({
      headers: await headers(),
      body: {
        newPassword: parsed.data.newPassword,
        currentPassword: parsed.data.currentPassword,
        revokeOtherSessions: parsed.data.revokeOtherSessions,
      }
    });

    await prisma.auditLog.create({
      data: {
        eventType: "SECURITY_PASSWORD_CHANGE",
        description: `Admin ${session.user.email} changed their password.`
      }
    });

    return { success: true };
  } catch (e: unknown) {
    return { success: false, error: settingsMutationError(e) };
  }
}

export async function revokeOtherSessionsAction() {
  const session = await requireAdmin();
  try {
    await auth.api.revokeOtherSessions({
      headers: await headers(),
    });

    await prisma.auditLog.create({
      data: {
        eventType: "SECURITY_SESSIONS_REVOKE",
        description: `Admin ${session.user.email} revoked other sessions.`
      }
    });

    return { success: true };
  } catch (e: unknown) {
    return { success: false, error: settingsMutationError(e) };
  }
}

const UpdateProfileSchema = z.object({
  name: z.string().min(2, "Nama minimal 2 karakter"),
});

const AppSettingSchema = z.discriminatedUnion("key", [
  z.object({ key: z.literal("APP_HEADER_ANNOUNCEMENT"), value: z.string().trim().max(300) }),
  z.object({ key: z.literal("APP_PUBLIC_CONTACT"), value: z.union([z.literal(""), z.email("Email kontak tidak valid")]) }),
]);

function settingsMutationError(error: unknown) {
  console.error("Mutasi pengaturan gagal", { name: error instanceof Error ? error.name : "UnknownError" });
  return "Permintaan tidak dapat diproses. Silakan coba lagi.";
}

export async function updateProfileAction(data: z.infer<typeof UpdateProfileSchema>) {
  const session = await requireAdmin();
  
  const parsed = UpdateProfileSchema.safeParse(data);
  if (!parsed.success) {
    return { success: false, error: "Data tidak valid" };
  }

  try {
    await auth.api.updateUser({
      headers: await headers(),
      body: {
        name: parsed.data.name,
      }
    });

    await prisma.auditLog.create({
      data: {
        eventType: "PROFILE_UPDATE",
        description: `Admin ${session.user.email} updated profile name to ${parsed.data.name}.`
      }
    });

    revalidatePath("/admin");
    revalidatePath("/admin/settings");

    return { success: true };
  } catch (e: unknown) {
    return { success: false, error: settingsMutationError(e) };
  }
}

// App Settings
export async function saveAppSettingAction(key: string, value: string) {
  const session = await requireAdmin();
  const parsed = AppSettingSchema.safeParse({ key, value });
  if (!parsed.success) return { success: false, error: "Pengaturan tidak valid" };
  
  try {
    await prisma.appSetting.upsert({
      where: { key: parsed.data.key },
      update: { value: parsed.data.value },
      create: parsed.data,
    });

    await prisma.auditLog.create({
      data: {
        eventType: "APP_SETTING_UPDATE",
        description: `Admin ${session.user.email} updated setting ${parsed.data.key}.`
      }
    });

    revalidatePath("/admin");
    revalidatePath("/");
    
    return { success: true };
  } catch (e: unknown) {
    return { success: false, error: settingsMutationError(e) };
  }
}
