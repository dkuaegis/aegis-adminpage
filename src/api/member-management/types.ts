export interface ApiResult<T> {
  ok: boolean;
  status: number;
  data?: T;
  errorName?: string;
}

export type MemberRole = 'ADMIN' | 'USER' | 'GUEST';
export type MemberRecordSource = 'PAYMENT_COMPLETED' | 'BACKFILL_PAYMENT';
export type StudyRole = 'INSTRUCTOR' | 'PARTICIPANT';

export interface MemberRecordSemesterOption {
  yearSemester: string;
  label: string;
  current: boolean;
}

export interface AdminMemberRecordItem {
  memberRecordId: number;
  memberId: number;
  snapshotStudentId: string | null;
  snapshotName: string;
  snapshotEmail: string;
  snapshotPhoneNumber: string | null;
  snapshotDepartment: string | null;
  snapshotGrade: string | null;
  snapshotRole: MemberRole;
  yearSemester: string;
  recordSource: MemberRecordSource;
  paymentId: number | null;
  paymentCompletedAt: string | null;
}

export interface AdminMemberRecordPage {
  content: AdminMemberRecordItem[];
  page: number;
  size: number;
  totalElements: number;
  totalPages: number;
  hasNext: boolean;
}

export interface AdminMemberRecordTimelineItem {
  memberRecordId: number;
  yearSemester: string;
  recordSource: MemberRecordSource;
  snapshotStudentId: string | null;
  snapshotName: string;
  snapshotEmail: string;
  snapshotPhoneNumber: string | null;
  snapshotDepartment: string | null;
  snapshotGrade: string | null;
  snapshotRole: MemberRole;
  paymentId: number | null;
  paymentCompletedAt: string | null;
}

export interface AdminMemberStudyParticipationItem {
  studyMemberId: number;
  studyId: number;
  studyTitle: string;
  studyRole: StudyRole;
  joinedAt: string;
}

export interface AdminMemberStudyAttendanceItem {
  studyAttendanceId: number;
  studyId: number;
  studyTitle: string;
  studySessionId: number;
  sessionDate: string;
  attendedAt: string;
}

export interface AdminMemberActivityParticipationItem {
  activityParticipationId: number;
  activityId: number;
  activityName: string;
  participatedAt: string;
}

export interface AdminMemberSemesterActivitySummary {
  studyParticipationCount: number;
  studyAttendanceCount: number;
  activityParticipationCount: number;
}

export interface AdminMemberSemesterActivityDetail {
  memberId: number;
  yearSemester: string;
  summary: AdminMemberSemesterActivitySummary;
  studyParticipations: AdminMemberStudyParticipationItem[];
  studyAttendances: AdminMemberStudyAttendanceItem[];
  activityParticipations: AdminMemberActivityParticipationItem[];
}
