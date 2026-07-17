import { prisma } from "@/lib/prisma";

export async function getAdminAuditLogs(page: number = 1, limit: number = 10, search?: string) {
  const where: import("@prisma/client").Prisma.AuditLogWhereInput = {};
  
  if (search) {
    where.OR = [
      { eventType: { contains: search } },
      { description: { contains: search } }
    ];
  }

  const [items, total] = await Promise.all([
    prisma.auditLog.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * limit,
      take: limit,
    }),
    prisma.auditLog.count({ where })
  ]);

  return {
    items,
    total,
    totalPages: Math.ceil(total / limit)
  };
}
