import type { AdminMemberRecordItem, AdminMemberRecordPage } from "@/api/member-management/types"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"

import type { MemberRoleFilter, SortFilter } from "../hooks/useMemberManagementPageState"

interface MemberRecordsSectionProps {
  keywordInput: string
  roleFilter: MemberRoleFilter
  sortFilter: SortFilter
  recordPage: AdminMemberRecordPage | null
  isRecordLoading: boolean
  selectedMemberId: number | null
  formatDateTime: (value: string | null) => string
  onKeywordInputChange: (value: string) => void
  onRoleFilterChange: (value: MemberRoleFilter) => void
  onSortFilterChange: (value: SortFilter) => void
  onSearch: () => void
  onSelectMember: (record: AdminMemberRecordItem) => void
  onMovePage: (nextPage: number) => void
}

export const MemberRecordsSection: React.FC<MemberRecordsSectionProps> = ({
  keywordInput,
  roleFilter,
  sortFilter,
  recordPage,
  isRecordLoading,
  selectedMemberId,
  formatDateTime,
  onKeywordInputChange,
  onRoleFilterChange,
  onSortFilterChange,
  onSearch,
  onSelectMember,
  onMovePage,
}) => {
  return (
    <Card>
      <CardContent className="space-y-4 p-5">
        <div className="flex flex-wrap items-center gap-2">
          <Input
            value={keywordInput}
            onChange={(event) => onKeywordInputChange(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === "Enter") {
                onSearch()
              }
            }}
            placeholder="이름/학번/이메일 검색"
            className="w-[280px]"
          />

          <Select value={roleFilter} onValueChange={(value) => onRoleFilterChange(value as MemberRoleFilter)}>
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

          <Select value={sortFilter} onValueChange={(value) => onSortFilterChange(value as SortFilter)}>
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

          <Button onClick={onSearch}>검색</Button>
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
                  const isSelected = selectedMemberId === record.memberRecordId

                  return (
                    <TableRow
                      key={record.memberRecordId}
                      className={isSelected ? "bg-accent" : "cursor-pointer"}
                      onClick={() => onSelectMember(record)}
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
            총 {recordPage?.totalElements ?? 0}건, 페이지 {recordPage ? recordPage.page + 1 : 1} / {recordPage?.totalPages ?? 1}
          </span>

          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              disabled={(recordPage?.page ?? 0) <= 0}
              onClick={() => onMovePage((recordPage?.page ?? 0) - 1)}
            >
              이전
            </Button>
            <Button
              variant="outline"
              size="sm"
              disabled={!(recordPage?.hasNext ?? false)}
              onClick={() => onMovePage((recordPage?.page ?? 0) + 1)}
            >
              다음
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
