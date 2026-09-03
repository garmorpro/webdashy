export const CURRENT_HANDOFF_SNAPSHOT_SCHEMA_VERSION: 3;
export const SUPPORTED_HANDOFF_SNAPSHOT_SCHEMA_VERSIONS: ReadonlySet<number>;
export function canonicalSnapshotSchemaVersion(templateSchemaVersion: number): number;
export function snapshotSchemaVersionProblem(persistedVersion: number, snapshot: unknown): "SNAPSHOT_SCHEMA_VERSION_MISMATCH" | "SNAPSHOT_SCHEMA_VERSION_UNSUPPORTED" | null;
export type SnapshotSchemaValidation = { valid: boolean; schemaPath: string | null; schemaIssue: string | null };
export function validateRevision3Snapshot(snapshot: unknown): SnapshotSchemaValidation;
export function validateSnapshotShape(snapshot: unknown): SnapshotSchemaValidation;
export function revision3LegacySelectionIssue(snapshot: unknown): SnapshotSchemaValidation | null;
export function isSnapshotShapeValid(snapshot: unknown): boolean;
