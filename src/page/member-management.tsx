import { useEffect, useMemo, useState } from 'react';

import Header from '../components/Header';
import Sidebar from '../components/SideBar';
import { useAuthGuard } from '../hooks/useAuthGuard';
import { showError } from '../utils/alert';

import { getMemberRecords } from '../api/member-management/get-member-records';
import { getMemberRecordTimeline } from '../api/member-management/get-member-record-timeline';
import { getMemberSemesterActivities } from '../api/member-management/get-member-semester-activities';
import { getMemberRecordSemesters } from '../api/member-management/get-member-record-semesters';

import type {
  AdminMemberRecordItem,
  AdminMemberRecordPage,
  AdminMemberRecordTimelineItem,
  AdminMemberSemesterActivityDetail,
  MemberRecordSemesterOption,
  MemberRole,
} from '../api/member-management/types';

type MemberRoleFilter = 'ALL' | MemberRole;
type SortFilter = 'id,asc' | 'id,desc' | 'name,asc' | 'name,desc';

const FALLBACK_SEMESTER_OPTIONS: MemberRecordSemesterOption[] = [
  { yearSemester: 'YEAR_SEMESTER_2026_1', label: '2026-1', current: true },
  { yearSemester: 'YEAR_SEMESTER_2025_2', label: '2025-2', current: false },
  { yearSemester: 'YEAR_SEMESTER_2025_1', label: '2025-1', current: false },
];

function mapErrorMessage(errorName?: string): string {
  switch (errorName) {
    case 'MEMBER_NOT_FOUND':
      return '회원을 찾을 수 없습니다.';
    case 'INVALID_ENUM':
      return '학기 또는 필터 값이 올바르지 않습니다.';
    case 'BAD_REQUEST':
      return '요청 값이 올바르지 않습니다.';
    default:
      return '요청 처리에 실패했습니다.';
  }
}

function formatDateTime(value: string | null): string {
  if (!value) {
    return '-';
  }

  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) {
    return '-';
  }

  return parsed.toLocaleString('ko-KR', { hour12: false });
}

function parseSemesterLabel(label: string): { year: number; semester: number } {
  const [yearToken, semesterToken] = label.split('-');
  const year = Number(yearToken);
  const semester = Number(semesterToken);

  return {
    year: Number.isNaN(year) ? 0 : year,
    semester: Number.isNaN(semester) ? 0 : semester,
  };
}

function sortSemestersDesc(options: MemberRecordSemesterOption[]): MemberRecordSemesterOption[] {
  return [...options].sort((left, right) => {
    const leftParsed = parseSemesterLabel(left.label);
    const rightParsed = parseSemesterLabel(right.label);

    if (leftParsed.year !== rightParsed.year) {
      return rightParsed.year - leftParsed.year;
    }
    return rightParsed.semester - leftParsed.semester;
  });
}

const MemberManagementPage: React.FC = () => {
  const { isLoading, isAuthenticated } = useAuthGuard();

  const [semesterOptions, setSemesterOptions] = useState<MemberRecordSemesterOption[]>([]);
  const [isSemesterLoading, setIsSemesterLoading] = useState(false);
  const [selectedYearSemester, setSelectedYearSemester] = useState('');

  const [keywordInput, setKeywordInput] = useState('');
  const [appliedKeyword, setAppliedKeyword] = useState('');
  const [roleFilter, setRoleFilter] = useState<MemberRoleFilter>('ALL');
  const [sortFilter, setSortFilter] = useState<SortFilter>('id,asc');

  const [recordPageIndex, setRecordPageIndex] = useState(0);
  const [recordPage, setRecordPage] = useState<AdminMemberRecordPage | null>(null);
  const [isRecordLoading, setIsRecordLoading] = useState(false);

  const [selectedMember, setSelectedMember] = useState<AdminMemberRecordItem | null>(null);
  const [detailYearSemester, setDetailYearSemester] = useState('');

  const [isDetailLoading, setIsDetailLoading] = useState(false);
  const [timelineItems, setTimelineItems] = useState<AdminMemberRecordTimelineItem[]>([]);
  const [activityDetail, setActivityDetail] = useState<AdminMemberSemesterActivityDetail | null>(null);

  const semesterLabelMap = useMemo(() => {
    const nextMap = new Map<string, string>();
    semesterOptions.forEach((option) => {
      nextMap.set(option.yearSemester, option.label);
    });
    return nextMap;
  }, [semesterOptions]);

  const resolveSemesterLabel = (yearSemester: string): string => {
    return semesterLabelMap.get(yearSemester) ?? yearSemester;
  };

  const fetchSemesters = async (): Promise<void> => {
    setIsSemesterLoading(true);

    const response = await getMemberRecordSemesters();
    if (!response.ok || !response.data) {
      showError(mapErrorMessage(response.errorName));
      const sortedFallback = sortSemestersDesc(FALLBACK_SEMESTER_OPTIONS);
      setSemesterOptions(sortedFallback);
      setSelectedYearSemester(sortedFallback[0]?.yearSemester ?? '');
      setIsSemesterLoading(false);
      return;
    }

    const sortedOptions = sortSemestersDesc(response.data);
    setSemesterOptions(sortedOptions);
    setSelectedYearSemester(sortedOptions[0]?.yearSemester ?? '');
    setIsSemesterLoading(false);
  };

  const fetchMemberDetail = async (memberId: number, yearSemester: string): Promise<void> => {
    setIsDetailLoading(true);

    const [timelineResponse, activityResponse] = await Promise.all([
      getMemberRecordTimeline(memberId),
      getMemberSemesterActivities(memberId, yearSemester),
    ]);

    if (!timelineResponse.ok || !timelineResponse.data) {
      showError(mapErrorMessage(timelineResponse.errorName));
      setTimelineItems([]);
    } else {
      setTimelineItems(timelineResponse.data);
    }

    if (!activityResponse.ok || !activityResponse.data) {
      showError(mapErrorMessage(activityResponse.errorName));
      setActivityDetail(null);
    } else {
      setActivityDetail(activityResponse.data);
    }

    setIsDetailLoading(false);
  };

  useEffect(() => {
    if (!isAuthenticated) {
      return;
    }
    void fetchSemesters();
  }, [isAuthenticated]);

  useEffect(() => {
    if (!isAuthenticated || !selectedYearSemester) {
      return;
    }

    const loadRecords = async (): Promise<void> => {
      setIsRecordLoading(true);
      const response = await getMemberRecords({
        yearSemester: selectedYearSemester,
        page: recordPageIndex,
        size: 50,
        keyword: appliedKeyword || undefined,
        role: roleFilter === 'ALL' ? undefined : roleFilter,
        sort: sortFilter,
      });

      if (!response.ok || !response.data) {
        showError(mapErrorMessage(response.errorName));
        setRecordPage(null);
        setIsRecordLoading(false);
        return;
      }

      setRecordPage(response.data);
      setIsRecordLoading(false);
    };

    void loadRecords();
  }, [isAuthenticated, selectedYearSemester, recordPageIndex, appliedKeyword, roleFilter, sortFilter]);

  useEffect(() => {
    if (!selectedYearSemester) {
      return;
    }
    setDetailYearSemester(selectedYearSemester);
  }, [selectedYearSemester]);

  useEffect(() => {
    if (!selectedMember || !detailYearSemester) {
      return;
    }
    void fetchMemberDetail(selectedMember.memberId, detailYearSemester);
  }, [selectedMember, detailYearSemester]);

  const handleSearch = (): void => {
    setRecordPageIndex(0);
    setAppliedKeyword(keywordInput.trim());
  };

  const handleChangeSemester = (yearSemester: string): void => {
    setSelectedYearSemester(yearSemester);
    setRecordPageIndex(0);
    setSelectedMember(null);
    setTimelineItems([]);
    setActivityDetail(null);
  };

  const movePage = (nextPage: number): void => {
    if (nextPage < 0) {
      return;
    }
    if (recordPage && nextPage >= recordPage.totalPages) {
      return;
    }
    setRecordPageIndex(nextPage);
  };

  if (isLoading || isSemesterLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen">
        <div />
      </div>
    );
  }

  if (!isAuthenticated) {
    return null;
  }

  return (
    <>
      <Header />
      <div className="flex min-h-screen pt-[85px]">
        <Sidebar />
        <div className="flex-1 py-8 px-8 ml-60">
          <div className="w-full max-w-[1440px] mx-auto flex gap-5 items-start">
            <section className="flex-1 bg-white rounded-[12px] p-5 flex flex-col gap-4 min-h-[780px]">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <h1 className="font-size-24px font-weight-700">회원 관리</h1>
                  <p className="font-size-16px color-gray-60">
                    학기별 회원 기록을 조회하고, 선택한 회원의 활동 상세를 확인합니다.
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  <label className="font-size-14px color-gray-60">학기</label>
                  <select
                    value={selectedYearSemester}
                    onChange={(event) => {
                      handleChangeSemester(event.target.value);
                    }}
                    className="h-10 border border-gray-30 rounded-[10px] px-3 bg-white"
                  >
                    {semesterOptions.map((option) => (
                      <option key={option.yearSemester} value={option.yearSemester}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                <input
                  value={keywordInput}
                  onChange={(event) => {
                    setKeywordInput(event.target.value);
                  }}
                  onKeyDown={(event) => {
                    if (event.key === 'Enter') {
                      handleSearch();
                    }
                  }}
                  placeholder="이름/학번/이메일 검색"
                  className="h-10 w-[280px] border border-gray-30 rounded-[10px] px-3"
                />

                <select
                  value={roleFilter}
                  onChange={(event) => {
                    setRoleFilter(event.target.value as MemberRoleFilter);
                    setRecordPageIndex(0);
                  }}
                  className="h-10 border border-gray-30 rounded-[10px] px-3 bg-white"
                >
                  <option value="ALL">역할 전체</option>
                  <option value="ADMIN">ADMIN</option>
                  <option value="USER">USER</option>
                  <option value="GUEST">GUEST</option>
                </select>

                <select
                  value={sortFilter}
                  onChange={(event) => {
                    setSortFilter(event.target.value as SortFilter);
                    setRecordPageIndex(0);
                  }}
                  className="h-10 border border-gray-30 rounded-[10px] px-3 bg-white"
                >
                  <option value="id,asc">등록순(오래된 순)</option>
                  <option value="id,desc">등록순(최신 순)</option>
                  <option value="name,asc">이름 오름차순</option>
                  <option value="name,desc">이름 내림차순</option>
                </select>

                <button
                  className="h-10 px-4 rounded-[10px] bg-black color-white cursor-pointer"
                  onClick={handleSearch}
                >
                  검색
                </button>
              </div>

              <div className="overflow-x-auto border border-gray-20 rounded-[10px]">
                <table className="min-w-[980px] w-full text-left border-collapse">
                  <thead className="bg-gray-10">
                    <tr className="font-size-14px color-gray-60">
                      <th className="px-3 py-3">학번</th>
                      <th className="px-3 py-3">이름</th>
                      <th className="px-3 py-3">이메일</th>
                      <th className="px-3 py-3">역할</th>
                      <th className="px-3 py-3">학과</th>
                      <th className="px-3 py-3">학년</th>
                      <th className="px-3 py-3">기록 출처</th>
                      <th className="px-3 py-3">결제 완료 시각</th>
                    </tr>
                  </thead>
                  <tbody>
                    {!isRecordLoading && (recordPage?.content.length ?? 0) === 0 && (
                      <tr>
                        <td className="px-3 py-6 text-center color-gray-60" colSpan={8}>
                          조회 결과가 없습니다.
                        </td>
                      </tr>
                    )}

                    {isRecordLoading && (
                      <tr>
                        <td className="px-3 py-6 text-center color-gray-60" colSpan={8}>
                          회원 기록을 조회하는 중입니다.
                        </td>
                      </tr>
                    )}

                    {!isRecordLoading &&
                      recordPage?.content.map((record) => {
                        const isSelected = selectedMember?.memberRecordId === record.memberRecordId;
                        return (
                          <tr
                            key={record.memberRecordId}
                            className={`cursor-pointer border-t border-gray-15 ${isSelected ? 'bg-[#F2F3F8]' : 'hover:bg-gray-10'}`}
                            onClick={() => {
                              setSelectedMember(record);
                              setDetailYearSemester(selectedYearSemester);
                            }}
                          >
                            <td className="px-3 py-3">{record.snapshotStudentId ?? '-'}</td>
                            <td className="px-3 py-3">{record.snapshotName}</td>
                            <td className="px-3 py-3">{record.snapshotEmail}</td>
                            <td className="px-3 py-3">{record.snapshotRole}</td>
                            <td className="px-3 py-3">{record.snapshotDepartment ?? '-'}</td>
                            <td className="px-3 py-3">{record.snapshotGrade ?? '-'}</td>
                            <td className="px-3 py-3">{record.recordSource}</td>
                            <td className="px-3 py-3">{formatDateTime(record.paymentCompletedAt)}</td>
                          </tr>
                        );
                      })}
                  </tbody>
                </table>
              </div>

              <div className="flex items-center justify-between">
                <div className="font-size-14px color-gray-60">
                  총 {recordPage?.totalElements ?? 0}건, 페이지 {recordPage ? recordPage.page + 1 : 1} /{' '}
                  {recordPage?.totalPages ?? 1}
                </div>

                <div className="flex items-center gap-2">
                  <button
                    className="h-9 px-3 rounded-[8px] border border-gray-30 disabled:opacity-40"
                    disabled={(recordPage?.page ?? 0) <= 0}
                    onClick={() => {
                      movePage((recordPage?.page ?? 0) - 1);
                    }}
                  >
                    이전
                  </button>
                  <button
                    className="h-9 px-3 rounded-[8px] border border-gray-30 disabled:opacity-40"
                    disabled={!(recordPage?.hasNext ?? false)}
                    onClick={() => {
                      movePage((recordPage?.page ?? 0) + 1);
                    }}
                  >
                    다음
                  </button>
                </div>
              </div>
            </section>

            <aside className="w-[420px] bg-white rounded-[12px] p-5 flex flex-col gap-4 min-h-[780px]">
              {!selectedMember && (
                <div className="h-full flex items-center justify-center color-gray-60 text-center leading-7">
                  <span>
                    왼쪽 목록에서 회원을 선택하면
                    <br />
                    학기별 활동 상세와 기록 타임라인이 표시됩니다.
                  </span>
                </div>
              )}

              {selectedMember && (
                <>
                  <div className="flex flex-col gap-1">
                    <h2 className="font-size-20px font-weight-700">회원 상세</h2>
                    <div className="font-size-14px color-gray-60">memberId: {selectedMember.memberId}</div>
                    <div className="font-size-16px">{selectedMember.snapshotName}</div>
                    <div className="font-size-14px color-gray-60">{selectedMember.snapshotStudentId ?? '-'}</div>
                    <div className="font-size-14px color-gray-60 break-all">{selectedMember.snapshotEmail}</div>
                  </div>

                  <div className="flex items-center gap-2">
                    <label className="font-size-14px color-gray-60">상세 학기</label>
                    <select
                      value={detailYearSemester}
                      onChange={(event) => {
                        setDetailYearSemester(event.target.value);
                      }}
                      className="h-10 border border-gray-30 rounded-[10px] px-3 bg-white"
                    >
                      {semesterOptions.map((option) => (
                        <option key={option.yearSemester} value={option.yearSemester}>
                          {option.label}
                        </option>
                      ))}
                    </select>
                  </div>

                  {isDetailLoading && (
                    <div className="font-size-14px color-gray-60">상세 정보를 조회하는 중입니다.</div>
                  )}

                  {!isDetailLoading && activityDetail && (
                    <section className="border border-gray-20 rounded-[10px] p-3 flex flex-col gap-2">
                      <h3 className="font-size-16px font-weight-600">
                        {resolveSemesterLabel(detailYearSemester)} 활동 요약
                      </h3>
                      <div className="font-size-14px color-gray-60 leading-6">
                        <div>스터디 참여: {activityDetail.summary.studyParticipationCount}건</div>
                        <div>스터디 출석: {activityDetail.summary.studyAttendanceCount}건</div>
                        <div>활동 참여: {activityDetail.summary.activityParticipationCount}건</div>
                      </div>

                      <div className="font-size-14px leading-6">
                        <div className="font-weight-600">스터디 참여</div>
                        {activityDetail.studyParticipations.length === 0 && (
                          <div className="color-gray-60">기록 없음</div>
                        )}
                        {activityDetail.studyParticipations.map((item) => (
                          <div key={item.studyMemberId} className="color-gray-60">
                            [{item.studyRole}] {item.studyTitle}
                          </div>
                        ))}
                      </div>

                      <div className="font-size-14px leading-6">
                        <div className="font-weight-600">스터디 출석</div>
                        {activityDetail.studyAttendances.length === 0 && (
                          <div className="color-gray-60">기록 없음</div>
                        )}
                        {activityDetail.studyAttendances.map((item) => (
                          <div key={item.studyAttendanceId} className="color-gray-60">
                            {item.studyTitle} ({item.sessionDate})
                          </div>
                        ))}
                      </div>

                      <div className="font-size-14px leading-6">
                        <div className="font-weight-600">활동 참여</div>
                        {activityDetail.activityParticipations.length === 0 && (
                          <div className="color-gray-60">기록 없음</div>
                        )}
                        {activityDetail.activityParticipations.map((item) => (
                          <div key={item.activityParticipationId} className="color-gray-60">
                            {item.activityName} ({formatDateTime(item.participatedAt)})
                          </div>
                        ))}
                      </div>
                    </section>
                  )}

                  <section className="border border-gray-20 rounded-[10px] p-3 flex flex-col gap-2">
                    <h3 className="font-size-16px font-weight-600">회원 기록 타임라인</h3>
                    {timelineItems.length === 0 && (
                      <div className="font-size-14px color-gray-60">타임라인 기록 없음</div>
                    )}

                    {timelineItems.map((item) => (
                      <div key={item.memberRecordId} className="border-t border-gray-15 pt-2 first:border-t-0 first:pt-0">
                        <div className="font-size-14px font-weight-600">
                          {resolveSemesterLabel(item.yearSemester)} / {item.snapshotRole}
                        </div>
                        <div className="font-size-13px color-gray-60">{item.recordSource}</div>
                        <div className="font-size-13px color-gray-60">{item.snapshotEmail}</div>
                      </div>
                    ))}
                  </section>
                </>
              )}
            </aside>
          </div>
        </div>
      </div>
    </>
  );
};

export default MemberManagementPage;
