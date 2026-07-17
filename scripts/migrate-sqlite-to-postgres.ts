import path from "node:path";
import Database from "better-sqlite3";
import { PrismaClient } from "@prisma/client";

type SqliteRow = Record<string, unknown>;

const sourcePath = path.resolve(process.env.SQLITE_SOURCE_PATH ?? "./prisma/dev.db");
const directUrl = process.env.DIRECT_URL;
const isDryRun = process.env.MIGRATION_DRY_RUN === "true";

if (!directUrl?.startsWith("postgresql://") && !directUrl?.startsWith("postgres://")) {
  throw new Error("DIRECT_URL PostgreSQL wajib tersedia untuk transfer ke Supabase.");
}

if (!isDryRun && process.env.CONFIRM_SQLITE_TO_POSTGRES_MIGRATION !== "YES") {
  throw new Error("Set CONFIRM_SQLITE_TO_POSTGRES_MIGRATION=YES untuk mengizinkan penulisan ke PostgreSQL.");
}

const source = new Database(sourcePath, { readonly: true, fileMustExist: true });
const target = new PrismaClient({ datasourceUrl: directUrl });
source.pragma("query_only = ON");

function hasTable(table: string) {
  return Boolean(source.prepare("SELECT 1 FROM sqlite_master WHERE type = 'table' AND name = ?").get(table));
}

function rows(table: string): SqliteRow[] {
  return hasTable(table) ? source.prepare(`SELECT * FROM "${table}"`).all() as SqliteRow[] : [];
}

function requiredString(row: SqliteRow, field: string) {
  const value = row[field];
  if (typeof value !== "string") throw new Error(`Field ${field} pada SQLite tidak valid.`);
  return value;
}

function nullableString(row: SqliteRow, field: string) {
  const value = row[field];
  return typeof value === "string" ? value : null;
}

function requiredNumber(row: SqliteRow, field: string) {
  const value = row[field];
  if (typeof value !== "number" || !Number.isFinite(value)) throw new Error(`Field ${field} pada SQLite tidak valid.`);
  return value;
}

function nullableNumber(row: SqliteRow, field: string) {
  const value = row[field];
  return typeof value === "number" && Number.isFinite(value) ? value : null;
}

function requiredDate(row: SqliteRow, field: string) {
  const value = row[field];
  const date = new Date(typeof value === "bigint" ? Number(value) : value as string | number);
  if (Number.isNaN(date.getTime())) throw new Error(`Field tanggal ${field} pada SQLite tidak valid.`);
  return date;
}

function nullableDate(row: SqliteRow, field: string) {
  return row[field] === null || row[field] === undefined ? null : requiredDate(row, field);
}

function requiredBoolean(row: SqliteRow, field: string) {
  const value = row[field];
  if (value === true || value === 1) return true;
  if (value === false || value === 0) return false;
  throw new Error(`Field boolean ${field} pada SQLite tidak valid.`);
}

function nullableBytes(row: SqliteRow, field: string) {
  const value = row[field];
  if (value === null || value === undefined) return null;
  if (Buffer.isBuffer(value)) return value;
  if (value instanceof Uint8Array) return Buffer.from(value);
  throw new Error(`Field BLOB ${field} pada SQLite tidak valid.`);
}

function readSourceSnapshot() {
  source.exec("BEGIN");
  try {
    const snapshot = {
      users: rows("user"),
      events: rows("SoundEvent"),
      auditLogs: rows("AuditLog"),
      settings: rows("AppSetting"),
      accounts: rows("account"),
      sessions: rows("session"),
      verifications: rows("verification"),
      pageViews: rows("PageView"),
      activeVisitors: rows("ActiveVisitor"),
    };
    source.exec("COMMIT");
    return snapshot;
  } catch (error) {
    source.exec("ROLLBACK");
    throw error;
  }
}

const sourceRows = readSourceSnapshot();

async function migrate() {
  if (sourceRows.users.length > 1) throw new Error("SQLite memiliki lebih dari satu admin; migrasi dihentikan.");

  const counts = Object.fromEntries(Object.entries(sourceRows).map(([table, data]) => [table, data.length]));
  console.log("Sumber SQLite tervalidasi:", counts);
  if (isDryRun) {
    console.log("Dry-run selesai; tidak ada data yang ditulis ke PostgreSQL.");
    return;
  }

  const targetUsers = await target.user.findMany({ select: { id: true, email: true }, take: 2 });
  if (targetUsers.length > 1) throw new Error("PostgreSQL sudah memiliki lebih dari satu user; migrasi dihentikan.");
  if (targetUsers.length === 1) {
    const sourceUser = sourceRows.users[0];
    if (!sourceUser || targetUsers[0].id !== requiredString(sourceUser, "id") || targetUsers[0].email !== requiredString(sourceUser, "email")) {
      throw new Error("PostgreSQL sudah memiliki admin berbeda. Kosongkan target atau gunakan database baru.");
    }
  }

  for (const row of sourceRows.users) {
    const data = {
      id: requiredString(row, "id"),
      name: requiredString(row, "name"),
      email: requiredString(row, "email"),
      emailVerified: requiredBoolean(row, "emailVerified"),
      image: nullableString(row, "image"),
      createdAt: requiredDate(row, "createdAt"),
      updatedAt: requiredDate(row, "updatedAt"),
    };
    await target.user.upsert({ where: { id: data.id }, update: data, create: data });
  }

  for (const row of sourceRows.events) {
    const data = {
      id: requiredString(row, "id"),
      slug: requiredString(row, "slug"),
      title: requiredString(row, "title"),
      summary: nullableString(row, "summary"),
      description: nullableString(row, "description"),
      venueName: nullableString(row, "venueName"),
      address: requiredString(row, "address"),
      district: nullableString(row, "district"),
      city: requiredString(row, "city"),
      province: requiredString(row, "province"),
      latitude: requiredNumber(row, "latitude"),
      longitude: requiredNumber(row, "longitude"),
      sourceDb: requiredNumber(row, "sourceDb"),
      sourcePlatform: requiredString(row, "sourcePlatform"),
      sourceUrl: requiredString(row, "sourceUrl"),
      sourceAccount: nullableString(row, "sourceAccount"),
      audioUrl: nullableString(row, "audioUrl"),
      audioTitle: nullableString(row, "audioTitle"),
      audioData: nullableBytes(row, "audioData"),
      audioMimeType: nullableString(row, "audioMimeType"),
      audioFileName: nullableString(row, "audioFileName"),
      audioSize: nullableNumber(row, "audioSize"),
      startAt: requiredDate(row, "startAt"),
      endAt: requiredDate(row, "endAt"),
      publicationStatus: requiredString(row, "publicationStatus"),
      featured: requiredBoolean(row, "featured"),
      publishedAt: nullableDate(row, "publishedAt"),
      createdAt: requiredDate(row, "createdAt"),
      updatedAt: requiredDate(row, "updatedAt"),
    };
    await target.soundEvent.upsert({ where: { id: data.id }, update: data, create: data });
  }

  for (const row of sourceRows.auditLogs) {
    const data = {
      id: requiredString(row, "id"),
      eventType: requiredString(row, "eventType"),
      description: requiredString(row, "description"),
      createdAt: requiredDate(row, "createdAt"),
    };
    await target.auditLog.upsert({ where: { id: data.id }, update: data, create: data });
  }

  for (const row of sourceRows.settings) {
    const data = {
      id: requiredString(row, "id"),
      key: requiredString(row, "key"),
      value: requiredString(row, "value"),
      updatedAt: requiredDate(row, "updatedAt"),
    };
    await target.appSetting.upsert({ where: { key: data.key }, update: { value: data.value, updatedAt: data.updatedAt }, create: data });
  }

  for (const row of sourceRows.accounts) {
    const data = {
      id: requiredString(row, "id"),
      accountId: requiredString(row, "accountId"),
      providerId: requiredString(row, "providerId"),
      userId: requiredString(row, "userId"),
      accessToken: nullableString(row, "accessToken"),
      refreshToken: nullableString(row, "refreshToken"),
      idToken: nullableString(row, "idToken"),
      accessTokenExpiresAt: nullableDate(row, "accessTokenExpiresAt"),
      refreshTokenExpiresAt: nullableDate(row, "refreshTokenExpiresAt"),
      scope: nullableString(row, "scope"),
      password: nullableString(row, "password"),
      createdAt: requiredDate(row, "createdAt"),
      updatedAt: requiredDate(row, "updatedAt"),
    };
    await target.account.upsert({ where: { id: data.id }, update: data, create: data });
  }

  for (const row of sourceRows.sessions) {
    const data = {
      id: requiredString(row, "id"),
      expiresAt: requiredDate(row, "expiresAt"),
      token: requiredString(row, "token"),
      createdAt: requiredDate(row, "createdAt"),
      updatedAt: requiredDate(row, "updatedAt"),
      ipAddress: nullableString(row, "ipAddress"),
      userAgent: nullableString(row, "userAgent"),
      userId: requiredString(row, "userId"),
    };
    await target.session.upsert({ where: { id: data.id }, update: data, create: data });
  }

  for (const row of sourceRows.verifications) {
    const data = {
      id: requiredString(row, "id"),
      identifier: requiredString(row, "identifier"),
      value: requiredString(row, "value"),
      expiresAt: requiredDate(row, "expiresAt"),
      createdAt: nullableDate(row, "createdAt"),
      updatedAt: nullableDate(row, "updatedAt"),
    };
    await target.verification.upsert({ where: { id: data.id }, update: data, create: data });
  }

  for (const row of sourceRows.pageViews) {
    const data = {
      id: requiredString(row, "id"),
      path: requiredString(row, "path"),
      date: requiredString(row, "date"),
      count: requiredNumber(row, "count"),
      createdAt: requiredDate(row, "createdAt"),
      updatedAt: requiredDate(row, "updatedAt"),
    };
    await target.pageView.upsert({
      where: { path_date: { path: data.path, date: data.date } },
      update: { count: data.count, createdAt: data.createdAt, updatedAt: data.updatedAt },
      create: data,
    });
  }

  for (const row of sourceRows.activeVisitors) {
    const data = {
      id: requiredString(row, "id"),
      userAgent: nullableString(row, "userAgent"),
      lastSeen: requiredDate(row, "lastSeen"),
      path: requiredString(row, "path"),
    };
    await target.activeVisitor.upsert({ where: { id: data.id }, update: data, create: data });
  }

  console.log("Transfer SQLite ke PostgreSQL selesai tanpa menghapus data target.");
}

void migrate()
  .catch((error: unknown) => {
    console.error(error instanceof Error ? error.message : "Migrasi data gagal.");
    process.exitCode = 1;
  })
  .finally(async () => {
    source.close();
    await target.$disconnect();
  });
