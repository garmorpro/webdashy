-- CreateEnum
CREATE TYPE "QuestionnaireStatus" AS ENUM ('SENT', 'IN_PROGRESS', 'SUBMITTED');

-- AlterEnum
-- This migration adds more than one value to an enum.
-- With PostgreSQL versions 11 and earlier, this is not possible
-- in a single migration. This can be worked around by creating
-- multiple migrations, each migration adding only one value to
-- the enum.


ALTER TYPE "ClientStatus" ADD VALUE 'QUESTIONNAIRE_SENT';
ALTER TYPE "ClientStatus" ADD VALUE 'QUESTIONNAIRE_DONE';

-- CreateTable
CREATE TABLE "DesignQuestionnaire" (
    "id" TEXT NOT NULL,
    "clientId" TEXT NOT NULL,
    "token" TEXT NOT NULL,
    "status" "QuestionnaireStatus" NOT NULL DEFAULT 'SENT',
    "answers" JSONB,
    "sentAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "submittedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "DesignQuestionnaire_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "DesignQuestionnaire_clientId_key" ON "DesignQuestionnaire"("clientId");

-- CreateIndex
CREATE UNIQUE INDEX "DesignQuestionnaire_token_key" ON "DesignQuestionnaire"("token");

-- AddForeignKey
ALTER TABLE "DesignQuestionnaire" ADD CONSTRAINT "DesignQuestionnaire_clientId_fkey" FOREIGN KEY ("clientId") REFERENCES "Client"("id") ON DELETE CASCADE ON UPDATE CASCADE;

