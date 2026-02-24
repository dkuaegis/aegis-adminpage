import type {
  PaginationState,
  SortingState,
  Updater,
} from "@tanstack/react-table";
import { functionalUpdate } from "@tanstack/react-table";
import { useEffect, useMemo, useState } from "react";
import { getMemberRecordSemesters } from "@/api/member-management/get-member-record-semesters";
import { getMemberRecordTimeline } from "@/api/member-management/get-member-record-timeline";
import { getMemberRecords } from "@/api/member-management/get-member-records";
import { getMemberSemesterActivities } from "@/api/member-management/get-member-semester-activities";
import type {
  AdminMemberRecordItem,
  AdminMemberRecordPage,
  AdminMemberRecordTimelineItem,
  AdminMemberSemesterActivityDetail,
  MemberRecordSemesterOption,
  MemberRole,
} from "@/api/member-management/types";
import type { ColumnSortMap } from "@/components/admin";
import {
  createSortingState,
  normalizeSingleSorting,
  serializeSortingState,
} from "@/components/admin";
import { resolveAdminErrorMessage } from "@/lib/errors/admin-error";
import { showError } from "@/utils/alert";

export type MemberRoleFilter = "ALL" | MemberRole;
export type MemberSortPreset = "id,asc" | "id,desc" | "name,asc" | "name,desc";

const PAGE_SIZE = 50;

const MEMBER_SORT_MAP: ColumnSortMap = {
  id: "id",
  name: "name",
};

const DEFAULT_MEMBER_SORTING = createSortingState("id", false);

const FALLBACK_SEMESTER_OPTIONS: MemberRecordSemesterOption[] = [
  { yearSemester: "YEAR_SEMESTER_2026_1", label: "2026-1", current: true },
  { yearSemester: "YEAR_SEMESTER_2025_2", label: "2025-2", current: false },
  { yearSemester: "YEAR_SEMESTER_2025_1", label: "2025-1", current: false },
];

const memberManagementErrorOverrides: Record<string, string> = {
  INVALID_ENUM: "학기 또는 필터 값이 올바르지 않습니다.",
};

const resolveMemberManagementErrorMessage = (errorName?: string): string => {
  return resolveAdminErrorMessage(errorName, {
    overrides: memberManagementErrorOverrides,
  });
};

function parseSemesterLabel(label: string): { year: number; semester: number } {
  const [yearToken, semesterToken] = label.split("-");
  const year = Number(yearToken);
  const semester = Number(semesterToken);

  return {
    year: Number.isNaN(year) ? 0 : year,
    semester: Number.isNaN(semester) ? 0 : semester,
  };
}

function sortSemestersDesc(
  options: MemberRecordSemesterOption[]
): MemberRecordSemesterOption[] {
  return [...options].sort((left, right) => {
    const leftParsed = parseSemesterLabel(left.label);
    const rightParsed = parseSemesterLabel(right.label);

    if (leftParsed.year !== rightParsed.year) {
      return rightParsed.year - leftParsed.year;
    }
    return rightParsed.semester - leftParsed.semester;
  });
}

function sortingToPreset(sorting: SortingState): MemberSortPreset {
  const first = sorting[0];
  if (!first) {
    return "id,asc";
  }

  if (first.id === "name") {
    return first.desc ? "name,desc" : "name,asc";
  }

  return first.desc ? "id,desc" : "id,asc";
}

function presetToSorting(preset: MemberSortPreset): SortingState {
  switch (preset) {
    case "id,desc":
      return createSortingState("id", true);
    case "name,asc":
      return createSortingState("name", false);
    case "name,desc":
      return createSortingState("name", true);
    default:
      return createSortingState("id", false);
  }
}

export function formatDateTime(value: string | null): string {
  if (!value) {
    return "-";
  }

  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) {
    return "-";
  }

  return parsed.toLocaleString("ko-KR", { hour12: false });
}

export interface MemberManagementPageState {
  semesterOptions: MemberRecordSemesterOption[];
  isSemesterLoading: boolean;
  selectedYearSemester: string;
  keywordInput: string;
  roleFilter: MemberRoleFilter;
  sortPreset: MemberSortPreset;
  sorting: SortingState;
  recordPagination: PaginationState;
  recordPage: AdminMemberRecordPage | null;
  isRecordLoading: boolean;
  selectedMember: AdminMemberRecordItem | null;
  detailYearSemester: string;
  isDetailLoading: boolean;
  timelineItems: AdminMemberRecordTimelineItem[];
  activityDetail: AdminMemberSemesterActivityDetail | null;
  resolveSemesterLabel: (yearSemester: string) => string;
  handleKeywordInputChange: (value: string) => void;
  handleSearch: () => void;
  handleChangeSemester: (yearSemester: string) => void;
  handleRoleFilterChange: (value: MemberRoleFilter) => void;
  handleSortPresetChange: (value: MemberSortPreset) => void;
  handleSortingChange: (updater: Updater<SortingState>) => void;
  handlePaginationChange: (updater: Updater<PaginationState>) => void;
  handleSelectMember: (record: AdminMemberRecordItem) => void;
  handleDetailSemesterChange: (yearSemester: string) => void;
}

export function useMemberManagementPageState(): MemberManagementPageState {
  const [semesterOptions, setSemesterOptions] = useState<
    MemberRecordSemesterOption[]
  >([]);
  const [isSemesterLoading, setIsSemesterLoading] = useState(false);
  const [selectedYearSemester, setSelectedYearSemester] = useState("");

  const [keywordInput, setKeywordInput] = useState("");
  const [appliedKeyword, setAppliedKeyword] = useState("");
  const [roleFilter, setRoleFilter] = useState<MemberRoleFilter>("ALL");
  const [sorting, setSorting] = useState<SortingState>(DEFAULT_MEMBER_SORTING);
  const [recordPagination, setRecordPagination] = useState<PaginationState>({
    pageIndex: 0,
    pageSize: PAGE_SIZE,
  });

  const [recordPage, setRecordPage] = useState<AdminMemberRecordPage | null>(
    null
  );
  const [isRecordLoading, setIsRecordLoading] = useState(false);

  const [selectedMember, setSelectedMember] =
    useState<AdminMemberRecordItem | null>(null);
  const [detailYearSemester, setDetailYearSemester] = useState("");

  const [isDetailLoading, setIsDetailLoading] = useState(false);
  const [timelineItems, setTimelineItems] = useState<
    AdminMemberRecordTimelineItem[]
  >([]);
  const [activityDetail, setActivityDetail] =
    useState<AdminMemberSemesterActivityDetail | null>(null);

  const semesterLabelMap = useMemo(() => {
    const nextMap = new Map<string, string>();
    semesterOptions.forEach((option) => {
      nextMap.set(option.yearSemester, option.label);
    });
    return nextMap;
  }, [semesterOptions]);

  const sortPreset = useMemo(() => sortingToPreset(sorting), [sorting]);

  const resolveSemesterLabel = (yearSemester: string): string => {
    return semesterLabelMap.get(yearSemester) ?? yearSemester;
  };

  useEffect(() => {
    let stale = false;

    const loadSemesters = async (): Promise<void> => {
      setIsSemesterLoading(true);
      try {
        const response = await getMemberRecordSemesters();
        if (stale) {
          return;
        }

        if (!response.ok || !response.data) {
          showError(resolveMemberManagementErrorMessage(response.errorName));
          const sortedFallback = sortSemestersDesc(FALLBACK_SEMESTER_OPTIONS);
          setSemesterOptions(sortedFallback);
          setSelectedYearSemester(sortedFallback[0]?.yearSemester ?? "");
          return;
        }

        const sortedOptions = sortSemestersDesc(response.data);
        setSemesterOptions(sortedOptions);
        setSelectedYearSemester(sortedOptions[0]?.yearSemester ?? "");
      } catch {
        if (stale) {
          return;
        }
        showError(resolveMemberManagementErrorMessage());
        const sortedFallback = sortSemestersDesc(FALLBACK_SEMESTER_OPTIONS);
        setSemesterOptions(sortedFallback);
        setSelectedYearSemester(sortedFallback[0]?.yearSemester ?? "");
      } finally {
        if (!stale) {
          setIsSemesterLoading(false);
        }
      }
    };

    void loadSemesters();
    return () => {
      stale = true;
    };
  }, []);

  useEffect(() => {
    if (!selectedYearSemester) {
      return;
    }

    let stale = false;

    const loadRecords = async (): Promise<void> => {
      setIsRecordLoading(true);
      try {
        const response = await getMemberRecords({
          yearSemester: selectedYearSemester,
          page: recordPagination.pageIndex,
          size: recordPagination.pageSize,
          keyword: appliedKeyword || undefined,
          role: roleFilter === "ALL" ? undefined : roleFilter,
          sort: serializeSortingState(sorting, MEMBER_SORT_MAP, "id,asc"),
        });
        if (stale) {
          return;
        }

        if (!response.ok) {
          showError(resolveMemberManagementErrorMessage(response.errorName));
          setRecordPage(null);
          return;
        }
        const data = response.data;
        if (!data) {
          showError(resolveMemberManagementErrorMessage());
          setRecordPage(null);
          return;
        }

        setRecordPage(data);
        setRecordPagination((prev) => ({
          ...prev,
          pageIndex: data.page,
          pageSize: data.size,
        }));
      } catch {
        if (stale) {
          return;
        }
        showError(resolveMemberManagementErrorMessage());
        setRecordPage(null);
      } finally {
        if (!stale) {
          setIsRecordLoading(false);
        }
      }
    };

    void loadRecords();
    return () => {
      stale = true;
    };
  }, [
    selectedYearSemester,
    recordPagination.pageIndex,
    recordPagination.pageSize,
    appliedKeyword,
    roleFilter,
    sorting,
  ]);

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

    let stale = false;

    const loadMemberDetail = async (): Promise<void> => {
      setIsDetailLoading(true);
      try {
        const [timelineResponse, activityResponse] = await Promise.all([
          getMemberRecordTimeline(selectedMember.memberId),
          getMemberSemesterActivities(
            selectedMember.memberId,
            detailYearSemester
          ),
        ]);
        if (stale) {
          return;
        }

        if (!timelineResponse.ok || !timelineResponse.data) {
          showError(
            resolveMemberManagementErrorMessage(timelineResponse.errorName)
          );
          setTimelineItems([]);
        } else {
          setTimelineItems(timelineResponse.data);
        }

        if (!activityResponse.ok || !activityResponse.data) {
          showError(
            resolveMemberManagementErrorMessage(activityResponse.errorName)
          );
          setActivityDetail(null);
        } else {
          setActivityDetail(activityResponse.data);
        }
      } catch {
        if (stale) {
          return;
        }
        showError(resolveMemberManagementErrorMessage());
        setTimelineItems([]);
        setActivityDetail(null);
      } finally {
        if (!stale) {
          setIsDetailLoading(false);
        }
      }
    };

    void loadMemberDetail();
    return () => {
      stale = true;
    };
  }, [selectedMember, detailYearSemester]);

  const handleKeywordInputChange = (value: string): void => {
    setKeywordInput(value);
  };

  const handleSearch = (): void => {
    setRecordPagination((prev) => ({
      ...prev,
      pageIndex: 0,
    }));
    setAppliedKeyword(keywordInput.trim());
  };

  const handleChangeSemester = (yearSemester: string): void => {
    setSelectedYearSemester(yearSemester);
    setRecordPagination((prev) => ({
      ...prev,
      pageIndex: 0,
    }));
    setSelectedMember(null);
    setTimelineItems([]);
    setActivityDetail(null);
  };

  const handleRoleFilterChange = (value: MemberRoleFilter): void => {
    setRoleFilter(value);
    setRecordPagination((prev) => ({
      ...prev,
      pageIndex: 0,
    }));
  };

  const handleSortPresetChange = (value: MemberSortPreset): void => {
    setSorting(presetToSorting(value));
    setRecordPagination((prev) => ({
      ...prev,
      pageIndex: 0,
    }));
  };

  const handleSortingChange = (updater: Updater<SortingState>): void => {
    setSorting((prev) =>
      normalizeSingleSorting(updater, prev, DEFAULT_MEMBER_SORTING)
    );
    setRecordPagination((prev) => ({
      ...prev,
      pageIndex: 0,
    }));
  };

  const handlePaginationChange = (updater: Updater<PaginationState>): void => {
    const nextPagination = functionalUpdate(updater, recordPagination);

    if (nextPagination.pageIndex < 0) {
      return;
    }

    if (recordPage && nextPagination.pageIndex >= recordPage.totalPages) {
      return;
    }

    setRecordPagination(nextPagination);
  };

  const handleSelectMember = (record: AdminMemberRecordItem): void => {
    setSelectedMember(record);
    setDetailYearSemester(selectedYearSemester);
  };

  const handleDetailSemesterChange = (yearSemester: string): void => {
    setDetailYearSemester(yearSemester);
  };

  return {
    semesterOptions,
    isSemesterLoading,
    selectedYearSemester,
    keywordInput,
    roleFilter,
    sortPreset,
    sorting,
    recordPagination,
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
    handleSortPresetChange,
    handleSortingChange,
    handlePaginationChange,
    handleSelectMember,
    handleDetailSemesterChange,
  };
}
