import { FeatureStatus } from "../types";

export const STATUS_ORDER: FeatureStatus[] = [
  "CREATED",
  "QA",
  "QA_APPROVED",
  "DEV",
  "PLAN_APPROVED",
  "CODE_GEN",
  "PR_CREATED",
  "DONE",
];

export const STATUS_LABELS: Record<FeatureStatus, string> = {
  CREATED: "Created",
  QA: "QA",
  QA_APPROVED: "QA Approved",
  DEV: "Dev",
  PLAN_APPROVED: "Plan Approved",
  CODE_GEN: "Code Gen",
  PR_CREATED: "PR Created",
  DONE: "Done",
};

export const NEXT_STATUS: Partial<Record<FeatureStatus, FeatureStatus>> = {
  CREATED: "QA",
  QA: "QA_APPROVED",
  QA_APPROVED: "DEV",
  DEV: "PLAN_APPROVED",
  PLAN_APPROVED: "CODE_GEN",
  CODE_GEN: "PR_CREATED",
  PR_CREATED: "DONE",
};

export function getNextStatus(status: FeatureStatus): FeatureStatus | null {
  return NEXT_STATUS[status] ?? null;
}
