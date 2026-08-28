-- CreateEnum
CREATE TYPE "PlanBillingType" AS ENUM ('ONE_TIME', 'MONTHLY');

-- AlterTable
ALTER TABLE "Plan" ADD COLUMN     "billingType" "PlanBillingType" NOT NULL DEFAULT 'ONE_TIME',
ADD COLUMN     "isPopular" BOOLEAN NOT NULL DEFAULT false;

