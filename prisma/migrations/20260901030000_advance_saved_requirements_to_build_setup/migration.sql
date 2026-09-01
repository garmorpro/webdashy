-- Project Requirements complete the combined Template & Plan phase.
-- Restrict the backfill to the exact prior stage so clients already further
-- through Workflow V2 can never be regressed.
UPDATE "Client" AS client
SET "workflowStage" = 'BUILD_SETUP'::"WorkflowStage",
    "status" = CASE
      WHEN client."status" = 'TEMPLATE_SELECTED'::"ClientStatus"
        THEN 'BUILDING'::"ClientStatus"
      ELSE client."status"
    END
WHERE client."workflowStage" = 'TEMPLATE_AND_PLAN'::"WorkflowStage"
  AND EXISTS (
    SELECT 1
    FROM "Portal" AS portal
    INNER JOIN "ProjectRequirements" AS requirements
      ON requirements."portalId" = portal."id"
    WHERE portal."clientId" = client."id"
  );
