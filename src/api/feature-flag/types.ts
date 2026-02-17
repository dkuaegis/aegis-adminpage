export interface MemberSignupFlag {
  featureFlagId: number | null;
  rawValue: string | null;
  enabled: boolean | null;
  valid: boolean;
  signupAllowed: boolean;
}

export interface StudyCreationFlag {
  featureFlagId: number | null;
  rawValue: string | null;
  enabled: boolean | null;
  valid: boolean;
  studyCreationAllowed: boolean;
}

export interface StudyEnrollWindowFlag {
  openFlagId: number | null;
  closeFlagId: number | null;
  openAtRaw: string | null;
  closeAtRaw: string | null;
  openAt: string | null;
  closeAt: string | null;
  valid: boolean;
  enrollmentAllowedNow: boolean;
}

export interface AdminFeatureFlags {
  memberSignup: MemberSignupFlag;
  studyCreation: StudyCreationFlag;
  studyEnrollWindow: StudyEnrollWindowFlag;
}
