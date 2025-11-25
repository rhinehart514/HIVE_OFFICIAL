// Temporary stub types for onboarding components used by onboarding-bridge-temp.

export interface OnboardingStep {
  id: string;
  title: string;
  description?: string;
}

export interface OnboardingState {
  currentStepId: string;
  completedStepIds: string[];
}

export type AcademicLevel =
  | 'freshman'
  | 'sophomore'
  | 'junior'
  | 'senior'
  | 'graduate'
  | 'other';

export type LivingSituation =
  | 'on_campus'
  | 'off_campus'
  | 'commuter'
  | 'other';

