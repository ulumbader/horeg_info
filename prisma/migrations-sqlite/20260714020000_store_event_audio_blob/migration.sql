-- AlterTable
ALTER TABLE "SoundEvent" ADD COLUMN "audioData" BLOB;
ALTER TABLE "SoundEvent" ADD COLUMN "audioMimeType" TEXT;
ALTER TABLE "SoundEvent" ADD COLUMN "audioFileName" TEXT;
ALTER TABLE "SoundEvent" ADD COLUMN "audioSize" INTEGER;
