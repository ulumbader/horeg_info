CREATE TYPE "CommentAuthorType" AS ENUM ('ANONYMOUS', 'ADMIN');

CREATE TABLE "EventComment" (
    "id" TEXT NOT NULL,
    "eventId" TEXT NOT NULL,
    "body" VARCHAR(500) NOT NULL,
    "authorType" "CommentAuthorType" NOT NULL,
    "anonymousActorHash" CHAR(64),
    "adminUserId" TEXT,
    "clientRequestId" VARCHAR(64),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "editedAt" TIMESTAMP(3),
    "deletedAt" TIMESTAMP(3),
    CONSTRAINT "EventComment_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "EventComment_body_length_check" CHECK (char_length("body") BETWEEN 1 AND 500),
    CONSTRAINT "EventComment_author_check" CHECK (
        ("authorType" = 'ANONYMOUS' AND "anonymousActorHash" IS NOT NULL AND "adminUserId" IS NULL)
        OR
        ("authorType" = 'ADMIN' AND "anonymousActorHash" IS NULL AND "adminUserId" IS NOT NULL)
    )
);

CREATE TABLE "EventLike" (
    "id" TEXT NOT NULL,
    "eventId" TEXT NOT NULL,
    "actorHash" CHAR(64) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "EventLike_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "EventComment_anonymousActorHash_clientRequestId_key" ON "EventComment"("anonymousActorHash", "clientRequestId");
CREATE INDEX "EventComment_eventId_deletedAt_createdAt_idx" ON "EventComment"("eventId", "deletedAt", "createdAt");
CREATE INDEX "EventComment_adminUserId_idx" ON "EventComment"("adminUserId");
CREATE UNIQUE INDEX "EventLike_eventId_actorHash_key" ON "EventLike"("eventId", "actorHash");
CREATE INDEX "EventLike_eventId_idx" ON "EventLike"("eventId");

ALTER TABLE "EventComment" ADD CONSTRAINT "EventComment_eventId_fkey" FOREIGN KEY ("eventId") REFERENCES "SoundEvent"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "EventComment" ADD CONSTRAINT "EventComment_adminUserId_fkey" FOREIGN KEY ("adminUserId") REFERENCES "user"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "EventLike" ADD CONSTRAINT "EventLike_eventId_fkey" FOREIGN KEY ("eventId") REFERENCES "SoundEvent"("id") ON DELETE CASCADE ON UPDATE CASCADE;
