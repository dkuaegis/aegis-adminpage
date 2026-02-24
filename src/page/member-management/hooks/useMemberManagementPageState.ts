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
import { resolveAdminErrorMessage } from "@/lib/errors/admin-error"
import { showError } from "@/utils/alert"

export type MemberRoleFilter = "ALL" | MemberRole
export type SortFilter = "id,asc" | "id,desc" | "name,asc" | "name,desc"

const FALLBACK_SEMESTER_OPTIONS: MemberRecordSemesterOption[] = [
  { yearSemester: "YEAR_SEMESTER_2026_1", label: "2026-1", current: true },
  { yearSemester: "YEAR_SEMESTER_2025_2", label: "2025-2", current: false },
  { yearSemester: "YEAR_SEMESTER_2025_1", label: "2025-1", current: false },
]

const memberManagementErrorOverrides: Record<string, string> = {
  INVALID_ENUM: "학기 또는 필터 값이 올바르지 않습니다.",
}

const resolveMemberManagementErrorMessage = (errorName?: string): string => {
  return resolveAdminErrorMessage(errorName, { overrides: memberManagementErrorOverrides })
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

export function formatDateTime(value: string | null): string {
  if (!value) {
    return "-"
  }

  const parsed = new Date(value)
  if (Number.isNaN(parsed.getTime())) {
    return "-"
  }

  return parsed.toLocaleString("ko-KR", { hour12: false })
}

export interface MemberManagementPageState {
  semesterOptions: MemberRecordSemesterOption[]
  isSemesterLoading: boolean
  selectedYearSemester: string
  keywordInput: string
  roleFilter: MemberRoleFilter
  sortFilter: SortFilter
  recordPage: AdminMemberRecordPage | null
  isRecordLoading: boolean
  selectedMember: AdminMemberRecordItem | null
  detailYearSemester: string
  isDetailLoading: boolean
  timelineItems: AdminMemberRecordTimelineItem[]
  activityDetail: AdminMemberSemesterActivityDetail | null
  resolveSemesterLabel: (yearSemester: string) => string
  handleKeywordInputChange: (value: string) => void
  handleSearch: () => void
  handleChangeSemester: (yearSemester: string) => void
  handleRoleFilterChange: (value: MemberRoleFilter) => void
  handleSortFilterChange: (value: SortFilter) => void
  handleSelectMember: (record: AdminMemberRecordItem) => void
  handleDetailSemesterChange: (yearSemester: string) => void
  movePage: (nextPage: number) => void
}

export function useMemberManagementPageState(): MemberManagementPageState {
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

  useEffect(() => {
    let stale = false

    const loadSemesters = async (): Promise<void> => {
      setIsSemesterLoading(true)
      try {
        const response = await getMemberRecordSemesters()
        if (stale) {
          return
        }

        if (!response.ok || !response.data) {
          showError(resolveMemberManagementErrorMessage(response.errorName))
          const sortedFallback = sortSemestersDesc(FALLBACK_SEMESTER_OPTIONS)
          setSemesterOptions(sortedFallback)
          setSelectedYearSemester(sortedFallback[0]?.yearSemester ?? "")
          return
        }

        const sortedOptions = sortSemestersDesc(response.data)
        setSemesterOptions(sortedOptions)
        setSelectedYearSemester(sortedOptions[0]?.yearSemester ?? "")
      } catch {
        if (stale) {
          return
        }
        showError(resolveMemberManagementErrorMessage())
        const sortedFallback = sortSemestersDesc(FALLBACK_SEMESTER_OPTIONS)
        setSemesterOptions(sortedFallback)
        setSelectedYearSemester(sortedFallback[0]?.yearSemester ?? "")
      } finally {
        if (!stale) {
          setIsSemesterLoading(false)
        }
      }
    }

    void loadSemesters()
    return () => {
      stale = true
    }
  }, [])

  useEffect(() => {
    if (!selectedYearSemester) {
      return
    }

    let stale = false

    const loadRecords = async (): Promise<void> => {
      setIsRecordLoading(true)
      try {
        const response = await getMemberRecords({
          yearSemester: selectedYearSemester,
          page: recordPageIndex,
          size: 50,
          keyword: appliedKeyword || undefined,
          role: roleFilter === "ALL" ? undefined : roleFilter,
          sort: sortFilter,
        })
        if (stale) {
          return
        }

        if (!response.ok || !response.data) {
          showError(resolveMemberManagementErrorMessage(response.errorName))
          setRecordPage(null)
          return
        }

        setRecordPage(response.data)
      } catch {
        if (stale) {
          return
        }
        showError(resolveMemberManagementErrorMessage())
        setRecordPage(null)
      } finally {
        if (!stale) {
          setIsRecordLoading(false)
        }
      }
    }

    void loadRecords()
    return () => {
      stale = true
    }
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

    let stale = false

    const loadMemberDetail = async (): Promise<void> => {
      setIsDetailLoading(true)
      try {
        const [timelineResponse, activityResponse] = await Promise.all([
          getMemberRecordTimeline(selectedMember.memberId),
          getMemberSemesterActivities(selectedMember.memberId, detailYearSemester),
        ])
        if (stale) {
          return
        }

        if (!timelineResponse.ok || !timelineResponse.data) {
          showError(resolveMemberManagementErrorMessage(timelineResponse.errorName))
          setTimelineItems([])
        } else {
          setTimelineItems(timelineResponse.data)
        }

        if (!activityResponse.ok || !activityResponse.data) {
          showError(resolveMemberManagementErrorMessage(activityResponse.errorName))
          setActivityDetail(null)
        } else {
          setActivityDetail(activityResponse.data)
        }
      } catch {
        if (stale) {
          return
        }
        showError(resolveMemberManagementErrorMessage())
        setTimelineItems([])
        setActivityDetail(null)
      } finally {
        if (!stale) {
          setIsDetailLoading(false)
        }
      }
    }

    void loadMemberDetail()
    return () => {
      stale = true
    }
  }, [selectedMember, detailYearSemester])

  const handleKeywordInputChange = (value: string): void => {
    setKeywordInput(value)
  }

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

  const handleRoleFilterChange = (value: MemberRoleFilter): void => {
    setRoleFilter(value)
    setRecordPageIndex(0)
  }

  const handleSortFilterChange = (value: SortFilter): void => {
    setSortFilter(value)
    setRecordPageIndex(0)
  }

  const handleSelectMember = (record: AdminMemberRecordItem): void => {
    setSelectedMember(record)
    setDetailYearSemester(selectedYearSemester)
  }

  const handleDetailSemesterChange = (yearSemester: string): void => {
    setDetailYearSemester(yearSemester)
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

  return {
    semesterOptions,
    isSemesterLoading,
    selectedYearSemester,
    keywordInput,
    roleFilter,
    sortFilter,
    recordPage,
    isRecordLoading,
    selectedMember,
    detailYearSemester,
    isDetailLoading,
    timelineItems,
    activityDetail,
    resolveSemesterLabel,
    handleKeywordInputChange,
    handleSearch,
    handleChangeSemester,
    handleRoleFilterChange,
    handleSortFilterChange,
    handleSelectMember,
    handleDetailSemesterChange,
    movePage,
  }
}
