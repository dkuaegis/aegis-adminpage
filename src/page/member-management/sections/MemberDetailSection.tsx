import type {
  AdminMemberRecordItem,
  AdminMemberRecordTimelineItem,
  AdminMemberSemesterActivityDetail,
  MemberRecordSemesterOption,
} from "@/api/member-management/types";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";

interface MemberDetailSectionProps {
  selectedMember: AdminMemberRecordItem | null;
  detailYearSemester: string;
  semesterOptions: MemberRecordSemesterOption[];
  isDetailLoading: boolean;
  timelineItems: AdminMemberRecordTimelineItem[];
  activityDetail: AdminMemberSemesterActivityDetail | null;
  formatDateTime: (value: string | null) => string;
  resolveSemesterLabel: (yearSemester: string) => string;
  onDetailSemesterChange: (yearSemester: string) => void;
}

export const MemberDetailSection: React.FC<MemberDetailSectionProps> = ({
  selectedMember,
  detailYearSemester,
  semesterOptions,
  isDetailLoading,
  timelineItems,
  activityDetail,
  formatDateTime,
  resolveSemesterLabel,
  onDetailSemesterChange,
}) => {
  return (
    <Card>
      <CardContent className="space-y-4 p-5">
        {!selectedMember && (
          <div className="py-16 text-center text-muted-foreground text-sm leading-7">
            왼쪽 목록에서 회원을 선택하면 학기별 활동 상세와 기록 타임라인이
            표시됩니다.
          </div>
        )}

        {selectedMember && (
          <>
            <div className="space-y-1">
              <h2 className="font-bold text-lg">회원 상세</h2>
              <div className="text-muted-foreground text-sm">
                memberId: {selectedMember.memberId}
              </div>
              <div>{selectedMember.snapshotName}</div>
              <div className="text-muted-foreground text-sm">
                {selectedMember.snapshotStudentId ?? "-"}
              </div>
              <div className="break-all text-muted-foreground text-sm">
                {selectedMember.snapshotEmail}
              </div>
            </div>

            <div className="flex items-center gap-2">
              <span className="text-muted-foreground text-sm">상세 학기</span>
              <Select
                value={detailYearSemester}
                onValueChange={onDetailSemesterChange}
              >
                <SelectTrigger className="w-[170px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {semesterOptions.map((option) => (
                    <SelectItem
                      key={option.yearSemester}
                      value={option.yearSemester}
                    >
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {isDetailLoading && (
              <div className="text-muted-foreground text-sm">
                상세 정보를 조회하는 중입니다.
              </div>
            )}

            {!isDetailLoading && activityDetail && (
              <section className="space-y-3 rounded-lg border p-3">
                <h3 className="font-semibold">
                  {resolveSemesterLabel(detailYearSemester)} 활동 요약
                </h3>
                <div className="grid grid-cols-1 gap-2 text-sm md:grid-cols-3">
                  <Badge variant="secondary">
                    스터디 참여:{" "}
                    {activityDetail.summary.studyParticipationCount}건
                  </Badge>
                  <Badge variant="secondary">
                    스터디 출석: {activityDetail.summary.studyAttendanceCount}건
                  </Badge>
                  <Badge variant="secondary">
                    활동 참여:{" "}
                    {activityDetail.summary.activityParticipationCount}건
                  </Badge>
                </div>

                <Separator />

                <div className="space-y-2 text-sm">
                  <div>
                    <div className="font-semibold">스터디 참여</div>
                    {activityDetail.studyParticipations.length === 0 && (
                      <div className="text-muted-foreground">기록 없음</div>
                    )}
                    {activityDetail.studyParticipations.map((item) => (
                      <div
                        key={item.studyMemberId}
                        className="text-muted-foreground"
                      >
                        [{item.studyRole}] {item.studyTitle}
                      </div>
                    ))}
                  </div>

                  <div>
                    <div className="font-semibold">스터디 출석</div>
                    {activityDetail.studyAttendances.length === 0 && (
                      <div className="text-muted-foreground">기록 없음</div>
                    )}
                    {activityDetail.studyAttendances.map((item) => (
                      <div
                        key={item.studyAttendanceId}
                        className="text-muted-foreground"
                      >
                        {item.studyTitle} ({item.sessionDate})
                      </div>
                    ))}
                  </div>

                  <div>
                    <div className="font-semibold">활동 참여</div>
                    {activityDetail.activityParticipations.length === 0 && (
                      <div className="text-muted-foreground">기록 없음</div>
                    )}
                    {activityDetail.activityParticipations.map((item) => (
                      <div
                        key={item.activityParticipationId}
                        className="text-muted-foreground"
                      >
                        {item.activityName} (
                        {formatDateTime(item.participatedAt)})
                      </div>
                    ))}
                  </div>
                </div>
              </section>
            )}

            <section className="space-y-2 rounded-lg border p-3">
              <h3 className="font-semibold">회원 기록 타임라인</h3>

              {timelineItems.length === 0 && (
                <div className="text-muted-foreground text-sm">
                  타임라인 기록 없음
                </div>
              )}

              {timelineItems.map((item) => (
                <div
                  key={item.memberRecordId}
                  className="space-y-1 rounded-md border p-2"
                >
                  <div className="font-semibold text-sm">
                    {resolveSemesterLabel(item.yearSemester)} /{" "}
                    {item.snapshotRole}
                  </div>
                  <div className="text-muted-foreground text-xs">
                    {item.recordSource}
                  </div>
                  <div className="text-muted-foreground text-xs">
                    {item.snapshotEmail}
                  </div>
                </div>
              ))}
            </section>
          </>
        )}
      </CardContent>
    </Card>
  );
};
