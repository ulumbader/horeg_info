import { prisma } from "@/lib/prisma";

export async function getAppSetting(key: string, defaultValue: string = "") {
  const setting = await prisma.appSetting.findUnique({ where: { key } });
  return setting?.value ?? defaultValue;
}
