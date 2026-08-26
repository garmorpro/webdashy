-- AlterTable
ALTER TABLE "AppSettings" ADD COLUMN     "apiKeyCreatedAt" TIMESTAMP(3),
ADD COLUMN     "apiKeyHash" TEXT,
ADD COLUMN     "apiKeyPreview" TEXT;

