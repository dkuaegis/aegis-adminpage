import { useEffect, useMemo, useState } from "react"

import { getMemberRecordSemesters } from "@/api/member-management/get-member-record-semesters"
import { getMemberRecordTimeline } from "@/api/member-management/get-member-record-timeline"
import { getMemberRecords } from "@/api/member-management/get-member-records"
import { getMemberSemesterActivities } from "@/api/member-management/get-member-semester-activities"
import type {
  AdminMemberRecordItem,
  AdminMemberRecordPage,
  AdminMemberRecordTimelineItem,
  AdminMemberSemesterActivityDetail,
  MemberRecordSemesterOption,
  MemberRole,
} from "@/api/member-management/types"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Separator } from "@/components/ui/separator"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { showError } from "@/utils/alert"

type MemberRoleFilter = "ALL" | MemberRole
type SortFilter = "id,asc" | "id,desc" | "name,asc" | "name,desc"

const FALLBACK_SEMESTER_OPTIONS: MemberRecordSemesterOption[] = [
  { yearSemester: "YEAR_SEMESTER_2026_1", label: "2026-1", current: true },
  { yearSemester: "YEAR_SEMESTER_2025_2", label: "2025-2", current: false },
  { yearSemester: "YEAR_SEMESTER_2025_1", label: "2025-1", current: false },
]

function mapErrorMessage(errorName?: string): string {
  switch (errorName) {
    case "MEMBER_NOT_FOUND":
      return "회원을 찾을 수 없습니다."
    case "INVALID_ENUM":
      return "학기 또는 필터 값이 올바르지 않습니다."
    case "BAD_REQUEST":
      return "요청 값이 올바르지 않습니다."
    default:
      return "요청 처리에 실패했습니다."
  }
}

function formatDateTime(value: string | null): string {
  if (!value) {
    return "-"
  }

  const parsed = new Date(value)
  if (Number.isNaN(parsed.getTime())) {
    return "-"
  }

  return parsed.toLocaleString("ko-KR", { hour12: false })
}

function parseSemesterLabel(label: string): { year: number; semester: number } {
  const [yearToken, semesterToken] = label.split("-")
  const year = Number(yearToken)
  const semester = Number(semesterToken)

  return {
    year: Number.isNaN(year) ? 0 : year,
    semester: Number.isNaN(semester) ? 0 : semester,
  }
}

function sortSemestersDesc(options: MemberRecordSemesterOption[]): MemberRecordSemesterOption[] {
  return [...options].sort((left, right) => {
    const leftParsed = parseSemesterLabel(left.label)
    const rightParsed = parseSemesterLabel(right.label)

    if (leftParsed.year !== rightParsed.year) {
      return rightParsed.year - leftParsed.year
    }
    return rightParsed.semester - leftParsed.semester
  })
}

const MemberManagementPage: React.FC = () => {
  const [semesterOptions, setSemesterOptions] = useState<MemberRecordSemesterOption[]>([])
  const [isSemesterLoading, setIsSemesterLoading] = useState(false)
  const [selectedYearSemester, setSelectedYearSemester] = useState("")

  const [keywordInput, setKeywordInput] = useState("")
  const [appliedKeyword, setAppliedKeyword] = useState("")
  const [roleFilter, setRoleFilter] = useState<MemberRoleFilter>("ALL")
  const [sortFilter, setSortFilter] = useState<SortFilter>("id,asc")

  const [recordPageIndex, setRecordPageIndex] = useState(0)
  const [recordPage, setRecordPage] = useState<AdminMemberRecordPage | null>(null)
  const [isRecordLoading, setIsRecordLoading] = useState(false)

  const [selectedMember, setSelectedMember] = useState<AdminMemberRecordItem | null>(null)
  const [detailYearSemester, setDetailYearSemester] = useState("")

  const [isDetailLoading, setIsDetailLoading] = useState(false)
  const [timelineItems, setTimelineItems] = useState<AdminMemberRecordTimelineItem[]>([])
  const [activityDetail, setActivityDetail] = useState<AdminMemberSemesterActivityDetail | null>(null)

  const semesterLabelMap = useMemo(() => {
    const nextMap = new Map<string, string>()
    semesterOptions.forEach((option) => {
      nextMap.set(option.yearSemester, option.label)
    })
    return nextMap
  }, [semesterOptions])

  const resolveSemesterLabel = (yearSemester: string): string => {
    return semesterLabelMap.get(yearSemester) ?? yearSemester
  }

  const fetchSemesters = async (): Promise<void> => {
    setIsSemesterLoading(true)

    const response = await getMemberRecordSemesters()
    if (!response.ok || !response.data) {
      showError(mapErrorMessage(response.errorName))
      const sortedFallback = sortSemestersDesc(FALLBACK_SEMESTER_OPTIONS)
      setSemesterOptions(sortedFallback)
      setSelectedYearSemester(sortedFallback[0]?.yearSemester ?? "")
      setIsSemesterLoading(false)
      return
    }

    const sortedOptions = sortSemestersDesc(response.data)
    setSemesterOptions(sortedOptions)
    setSelectedYearSemester(sortedOptions[0]?.yearSemester ?? "")
    setIsSemesterLoading(false)
  }

  const fetchMemberDetail = async (memberId: number, yearSemester: string): Promise<void> => {
    setIsDetailLoading(true)

    const [timelineResponse, activityResponse] = await Promise.all([
      getMemberRecordTimeline(memberId),
      getMemberSemesterActivities(memberId, yearSemester),
    ])

    if (!timelineResponse.ok || !timelineResponse.data) {
      showError(mapErrorMessage(timelineResponse.errorName))
      setTimelineItems([])
    } else {
      setTimelineItems(timelineResponse.data)
    }

    if (!activityResponse.ok || !activityResponse.data) {
      showError(mapErrorMessage(activityResponse.errorName))
      setActivityDetail(null)
    } else {
      setActivityDetail(activityResponse.data)
    }

    setIsDetailLoading(false)
  }

  useEffect(() => {
    void fetchSemesters()
  }, [])

  useEffect(() => {
    if (!selectedYearSemester) {
      return
    }

    const loadRecords = async (): Promise<void> => {
      setIsRecordLoading(true)
      const response = await getMemberRecords({
        yearSemester: selectedYearSemester,
        page: recordPageIndex,
        size: 50,
        keyword: appliedKeyword || undefined,
        role: roleFilter === "ALL" ? undefined : roleFilter,
        sort: sortFilter,
      })

      if (!response.ok || !response.data) {
        showError(mapErrorMessage(response.errorName))
        setRecordPage(null)
        setIsRecordLoading(false)
        return
      }

      setRecordPage(response.data)
      setIsRecordLoading(false)
    }

    void loadRecords()
  }, [selectedYearSemester, recordPageIndex, appliedKeyword, roleFilter, sortFilter])

  useEffect(() => {
    if (!selectedYearSemester) {
      return
    }
    setDetailYearSemester(selectedYearSemester)
  }, [selectedYearSemester])

  useEffect(() => {
    if (!selectedMember || !detailYearSemester) {
      return
    }
    void fetchMemberDetail(selectedMember.memberId, detailYearSemester)
  }, [selectedMember, detailYearSemester])

  const handleSearch = (): void => {
    setRecordPageIndex(0)
    setAppliedKeyword(keywordInput.trim())
  }

  const handleChangeSemester = (yearSemester: string): void => {
    setSelectedYearSemester(yearSemester)
    setRecordPageIndex(0)
    setSelectedMember(null)
    setTimelineItems([])
    setActivityDetail(null)
  }

  const movePage = (nextPage: number): void => {
    if (nextPage < 0) {
      return
    }
    if (recordPage && nextPage >= recordPage.totalPages) {
      return
    }
    setRecordPageIndex(nextPage)
  }

  if (isSemesterLoading) {
    return (
      <Card>
        <CardContent className="py-8 text-center text-muted-foreground">학기 정보를 불러오는 중입니다.</CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-5">
      <Card>
        <CardHeader className="flex flex-row flex-wrap items-end justify-between gap-3">
          <div>
            <CardTitle className="text-2xl">회원 관리</CardTitle>
            <CardDescription>학기별 회원 기록 조회 및 상세 활동 기록을 확인합니다.</CardDescription>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-sm text-muted-foreground">학기</span>
            <Select value={selectedYearSemester} onValueChange={handleChangeSemester}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="학기 선택" />
              </SelectTrigger>
              <SelectContent>
                {semesterOptions.map((option) => (
                  <SelectItem key={option.yearSemester} value={option.yearSemester}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardHeader>
      </Card>

      <div className="grid items-start gap-5 xl:grid-cols-[minmax(0,1fr)_420px]">
        <Card>
          <CardContent className="space-y-4 p-5">
            <div className="flex flex-wrap items-center gap-2">
              <Input
                value={keywordInput}
                onChange={(event) => setKeywordInput(event.target.value)}
                onKeyDown={(event) => {
                  if (event.key === "Enter") {
                    handleSearch()
                  }
                }}
                placeholder="이름/학번/이메일 검색"
                className="w-[280px]"
              />

              <Select
                value={roleFilter}
                onValueChange={(value) => {
                  setRoleFilter(value as MemberRoleFilter)
                  setRecordPageIndex(0)
                }}
              >
                <SelectTrigger className="w-[150px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ALL">역할 전체</SelectItem>
                  <SelectItem value="ADMIN">ADMIN</SelectItem>
                  <SelectItem value="USER">USER</SelectItem>
                  <SelectItem value="GUEST">GUEST</SelectItem>
                </SelectContent>
              </Select>

              <Select
                value={sortFilter}
                onValueChange={(value) => {
                  setSortFilter(value as SortFilter)
                  setRecordPageIndex(0)
                }}
              >
                <SelectTrigger className="w-[190px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="id,asc">등록순(오래된 순)</SelectItem>
                  <SelectItem value="id,desc">등록순(최신 순)</SelectItem>
                  <SelectItem value="name,asc">이름 오름차순</SelectItem>
                  <SelectItem value="name,desc">이름 내림차순</SelectItem>
                </SelectContent>
              </Select>

              <Button onClick={handleSearch}>검색</Button>
            </div>

            <div className="overflow-x-auto rounded-lg border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>학번</TableHead>
                    <TableHead>이름</TableHead>
                    <TableHead>이메일</TableHead>
                    <TableHead>역할</TableHead>
                    <TableHead>학과</TableHead>
                    <TableHead>학년</TableHead>
                    <TableHead>기록 출처</TableHead>
                    <TableHead>결제 완료 시각</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {!isRecordLoading && (recordPage?.content.length ?? 0) === 0 && (
                    <TableRow>
                      <TableCell className="h-16 text-center text-muted-foreground" colSpan={8}>
                        조회 결과가 없습니다.
                      </TableCell>
                    </TableRow>
                  )}

                  {isRecordLoading && (
                    <TableRow>
                      <TableCell className="h-16 text-center text-muted-foreground" colSpan={8}>
                        회원 기록을 조회하는 중입니다.
                      </TableCell>
                    </TableRow>
                  )}

                  {!isRecordLoading &&
                    recordPage?.content.map((record) => {
                      const isSelected = selectedMember?.memberRecordId === record.memberRecordId

                      return (
                        <TableRow
                          key={record.memberRecordId}
                          className={isSelected ? "bg-accent" : "cursor-pointer"}
                          onClick={() => {
                            setSelectedMember(record)
                            setDetailYearSemester(selectedYearSemester)
                          }}
                        >
                          <TableCell>{record.snapshotStudentId ?? "-"}</TableCell>
                          <TableCell>{record.snapshotName}</TableCell>
                          <TableCell className="max-w-[220px] truncate">{record.snapshotEmail}</TableCell>
                          <TableCell>{record.snapshotRole}</TableCell>
                          <TableCell>{record.snapshotDepartment ?? "-"}</TableCell>
                          <TableCell>{record.snapshotGrade ?? "-"}</TableCell>
                          <TableCell>{record.recordSource}</TableCell>
                          <TableCell>{formatDateTime(record.paymentCompletedAt)}</TableCell>
                        </TableRow>
                      )
                    })}
                </TableBody>
              </Table>
            </div>

            <div className="flex flex-wrap items-center justify-between gap-2 text-sm">
              <span className="text-muted-foreground">
                총 {recordPage?.totalElements ?? 0}건, 페이지 {recordPage ? recordPage.page + 1 : 1} /{" "}
                {recordPage?.totalPages ?? 1}
              </span>

              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  disabled={(recordPage?.page ?? 0) <= 0}
                  onClick={() => movePage((recordPage?.page ?? 0) - 1)}
                >
                  이전
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  disabled={!(recordPage?.hasNext ?? false)}
                  onClick={() => movePage((recordPage?.page ?? 0) + 1)}
                >
                  다음
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="space-y-4 p-5">
            {!selectedMember && (
              <div className="py-16 text-center text-sm leading-7 text-muted-foreground">
                왼쪽 목록에서 회원을 선택하면 학기별 활동 상세와 기록 타임라인이 표시됩니다.
              </div>
            )}

            {selectedMember && (
              <>
                <div className="space-y-1">
                  <h2 className="text-lg font-bold">회원 상세</h2>
                  <div className="text-sm text-muted-foreground">memberId: {selectedMember.memberId}</div>
                  <div>{selectedMember.snapshotName}</div>
                  <div className="text-sm text-muted-foreground">{selectedMember.snapshotStudentId ?? "-"}</div>
                  <div className="break-all text-sm text-muted-foreground">{selectedMember.snapshotEmail}</div>
                </div>

                <div className="flex items-center gap-2">
                  <span className="text-sm text-muted-foreground">상세 학기</span>
                  <Select value={detailYearSemester} onValueChange={setDetailYearSemester}>
                    <SelectTrigger className="w-[170px]">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {semesterOptions.map((option) => (
                        <SelectItem key={option.yearSemester} value={option.yearSemester}>
                          {option.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {isDetailLoading && <div className="text-sm text-muted-foreground">상세 정보를 조회하는 중입니다.</div>}

                {!isDetailLoading && activityDetail && (
                  <section className="space-y-3 rounded-lg border p-3">
                    <h3 className="font-semibold">{resolveSemesterLabel(detailYearSemester)} 활동 요약</h3>
                    <div className="grid grid-cols-1 gap-2 text-sm md:grid-cols-3">
                      <Badge variant="secondary">스터디 참여: {activityDetail.summary.studyParticipationCount}건</Badge>
                      <Badge variant="secondary">스터디 출석: {activityDetail.summary.studyAttendanceCount}건</Badge>
                      <Badge variant="secondary">활동 참여: {activityDetail.summary.activityParticipationCount}건</Badge>
                    </div>

                    <Separator />

                    <div className="space-y-2 text-sm">
                      <div>
                        <div className="font-semibold">스터디 참여</div>
                        {activityDetail.studyParticipations.length === 0 && <div className="text-muted-foreground">기록 없음</div>}
                        {activityDetail.studyParticipations.map((item) => (
                          <div key={item.studyMemberId} className="text-muted-foreground">
                            [{item.studyRole}] {item.studyTitle}
                          </div>
                        ))}
                      </div>

                      <div>
                        <div className="font-semibold">스터디 출석</div>
                        {activityDetail.studyAttendances.length === 0 && <div className="text-muted-foreground">기록 없음</div>}
                        {activityDetail.studyAttendances.map((item) => (
                          <div key={item.studyAttendanceId} className="text-muted-foreground">
                            {item.studyTitle} ({item.sessionDate})
                          </div>
                        ))}
                      </div>

                      <div>
                        <div className="font-semibold">활동 참여</div>
                        {activityDetail.activityParticipations.length === 0 && <div className="text-muted-foreground">기록 없음</div>}
                        {activityDetail.activityParticipations.map((item) => (
                          <div key={item.activityParticipationId} className="text-muted-foreground">
                            {item.activityName} ({formatDateTime(item.participatedAt)})
                          </div>
                        ))}
                      </div>
                    </div>
                  </section>
                )}

                <section className="space-y-2 rounded-lg border p-3">
                  <h3 className="font-semibold">회원 기록 타임라인</h3>

                  {timelineItems.length === 0 && <div className="text-sm text-muted-foreground">타임라인 기록 없음</div>}

                  {timelineItems.map((item) => (
                    <div key={item.memberRecordId} className="space-y-1 rounded-md border p-2">
                      <div className="text-sm font-semibold">
                        {resolveSemesterLabel(item.yearSemester)} / {item.snapshotRole}
                      </div>
                      <div className="text-xs text-muted-foreground">{item.recordSource}</div>
                      <div className="text-xs text-muted-foreground">{item.snapshotEmail}</div>
                    </div>
                  ))}
                </section>
              </>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

export default MemberManagementPage
