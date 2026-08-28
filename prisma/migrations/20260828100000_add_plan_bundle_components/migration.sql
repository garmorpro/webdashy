-- CreateTable
CREATE TABLE "_PlanBundleComponents" (
    "A" TEXT NOT NULL,
    "B" TEXT NOT NULL,

    CONSTRAINT "_PlanBundleComponents_AB_pkey" PRIMARY KEY ("A","B")
);

-- CreateIndex
CREATE INDEX "_PlanBundleComponents_B_index" ON "_PlanBundleComponents"("B");

-- AddForeignKey
ALTER TABLE "_PlanBundleComponents" ADD CONSTRAINT "_PlanBundleComponents_A_fkey" FOREIGN KEY ("A") REFERENCES "Plan"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_PlanBundleComponents" ADD CONSTRAINT "_PlanBundleComponents_B_fkey" FOREIGN KEY ("B") REFERENCES "Plan"("id") ON DELETE CASCADE ON UPDATE CASCADE;

