import { Card, CardContent } from "@/components/ui/card"

import {
  formatDateTime,
  useMemberManagementPageState,
} from "./member-management/hooks/useMemberManagementPageState"
import { MemberDetailSection } from "./member-management/sections/MemberDetailSection"
import { MemberManagementHeaderSection } from "./member-management/sections/MemberManagementHeaderSection"
import { MemberRecordsSection } from "./member-management/sections/MemberRecordsSection"

const MemberManagementPage: React.FC = () => {
  const state = useMemberManagementPageState()

  if (state.isSemesterLoading) {
    return (
      <Card>
        <CardContent className="py-8 text-center text-muted-foreground">학기 정보를 불러오는 중입니다.</CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-5">
      <MemberManagementHeaderSection
        semesterOptions={state.semesterOptions}
        selectedYearSemester={state.selectedYearSemester}
        onChangeSemester={state.handleChangeSemester}
      />

      <div className="grid items-start gap-5 xl:grid-cols-[minmax(0,1fr)_420px]">
        <MemberRecordsSection
          keywordInput={state.keywordInput}
          roleFilter={state.roleFilter}
          sortPreset={state.sortPreset}
          sorting={state.sorting}
          recordPagination={state.recordPagination}
          recordPage={state.recordPage}
          isRecordLoading={state.isRecordLoading}
          selectedMemberId={state.selectedMember?.memberRecordId ?? null}
          formatDateTime={formatDateTime}
          onKeywordInputChange={state.handleKeywordInputChange}
          onRoleFilterChange={state.handleRoleFilterChange}
          onSortPresetChange={state.handleSortPresetChange}
          onSortingChange={state.handleSortingChange}
          onPaginationChange={state.handlePaginationChange}
          onSearch={state.handleSearch}
          onSelectMember={state.handleSelectMember}
        />

        <MemberDetailSection
          selectedMember={state.selectedMember}
          detailYearSemester={state.detailYearSemester}
          semesterOptions={state.semesterOptions}
          isDetailLoading={state.isDetailLoading}
          timelineItems={state.timelineItems}
          activityDetail={state.activityDetail}
          formatDateTime={formatDateTime}
          resolveSemesterLabel={state.resolveSemesterLabel}
          onDetailSemesterChange={state.handleDetailSemesterChange}
        />
      </div>
    </div>
  )
}

export default MemberManagementPage
