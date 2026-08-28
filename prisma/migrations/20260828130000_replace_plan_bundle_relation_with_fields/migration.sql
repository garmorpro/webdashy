-- DropForeignKey
ALTER TABLE "_PlanBundleComponents" DROP CONSTRAINT "_PlanBundleComponents_A_fkey";

-- DropForeignKey
ALTER TABLE "_PlanBundleComponents" DROP CONSTRAINT "_PlanBundleComponents_B_fkey";

-- AlterTable
ALTER TABLE "Plan" ADD COLUMN     "bundleLines" TEXT[] NOT NULL DEFAULT '{}',
ADD COLUMN     "bundleSavingsText" TEXT,
ADD COLUMN     "bundleWhyText" TEXT,
ADD COLUMN     "isBundle" BOOLEAN NOT NULL DEFAULT false;

-- DropTable
DROP TABLE "_PlanBundleComponents";
