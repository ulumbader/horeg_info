-- CreateTable
CREATE TABLE "PageView" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "path" TEXT NOT NULL,
    "date" TEXT NOT NULL,
    "count" INTEGER NOT NULL DEFAULT 1,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "ActiveVisitor" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userAgent" TEXT,
    "lastSeen" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "path" TEXT NOT NULL DEFAULT '/'
);

-- CreateIndex
CREATE UNIQUE INDEX "PageView_path_date_key" ON "PageView"("path", "date");

-- CreateIndex
CREATE INDEX "ActiveVisitor_lastSeen_idx" ON "ActiveVisitor"("lastSeen");
