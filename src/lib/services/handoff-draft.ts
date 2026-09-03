import {
  HANDOFF_CARE_DISPOSITIONS, HANDOFF_CHECKLIST_STATUSES, HANDOFF_LAUNCH_STATUSES, HANDOFF_SECTION_FIELDS, HANDOFF_VISIBILITIES,
  assertDraftEditable,
  canNavigateToHandoffStep, handoffWizardStepAfterSave, initialHandoffWizardStep,
  guidedHandoffCompletion, hasSecretLookingKey, mergeHandoffDraft as mergeDraft, normalizeHandoffDraft as normalizeDraft,
  normalizeHandoffDate,
  resolveChecklistDefaults, shouldUseEditableHandoffWizard, toDateInputValue, validateChecklistSubmission, validateHandoffDraft as validateDraft,
  validateHandoffWizardStep as validateWizardStep,
} from "./handoff-draft-state.mjs";

export type HandoffThirdPartyService = Record<string, unknown> & { service: string; purpose: string; accountOwner: string; billingOwner: string; dataHandled: string };
type DraftSection = Record<string, unknown> & Record<string, string>;
export type HandoffDraftData = Record<string, unknown> & {
  projectSummary: DraftSection; websiteLaunch: DraftSection; domain: DraftSection; hosting: DraftSection;
  sourceCode: DraftSection; ownershipResponsibilities: DraftSection; thirdPartyServices: HandoffThirdPartyService[];
  maintenanceSupport: DraftSection; warranty: DraftSection; operationalResponsibilities: DraftSection; privacyDataCompliance: DraftSection;
  selectedPolicyKeys: string[]; adminNote: string;
};

export function normalizeHandoffDraft(value: unknown): HandoffDraftData { return normalizeDraft(value) as HandoffDraftData; }
export function mergeHandoffDraft(current: unknown, edits: unknown): HandoffDraftData { return mergeDraft(current, edits) as HandoffDraftData; }
export function validateHandoffDraft(value: unknown): HandoffDraftData { return validateDraft(value) as HandoffDraftData; }
export function validateHandoffWizardStep(value: unknown, step: number): HandoffDraftData { return validateWizardStep(value, step) as HandoffDraftData; }
export { HANDOFF_CARE_DISPOSITIONS, HANDOFF_CHECKLIST_STATUSES, HANDOFF_LAUNCH_STATUSES, HANDOFF_SECTION_FIELDS, HANDOFF_VISIBILITIES, assertDraftEditable, canNavigateToHandoffStep, guidedHandoffCompletion, handoffWizardStepAfterSave, hasSecretLookingKey, initialHandoffWizardStep, normalizeHandoffDate, resolveChecklistDefaults, shouldUseEditableHandoffWizard, toDateInputValue, validateChecklistSubmission };
