import type {
  ColumnDef,
  PaginationState,
  SortingState,
  Updater,
} from "@tanstack/react-table";
import { useMemo } from "react";

import type {
  AdminMemberRecordItem,
  AdminMemberRecordPage,
} from "@/api/member-management/types";
import { AdminDataTable } from "@/components/admin";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

import type {
  MemberRoleFilter,
  MemberSortPreset,
} from "../hooks/useMemberManagementPageState";

interface MemberRecordsSectionProps {
  keywordInput: string;
  roleFilter: MemberRoleFilter;
  sortPreset: MemberSortPreset;
  sorting: SortingState;
  recordPagination: PaginationState;
  recordPage: AdminMemberRecordPage | null;
  isRecordLoading: boolean;
  selectedMemberId: number | null;
  formatDateTime: (value: string | null) => string;
  onKeywordInputChange: (value: string) => void;
  onRoleFilterChange: (value: MemberRoleFilter) => void;
  onSortPresetChange: (value: MemberSortPreset) => void;
  onSortingChange: (updater: Updater<SortingState>) => void;
  onPaginationChange: (updater: Updater<PaginationState>) => void;
  onSearch: () => void;
  onSelectMember: (record: AdminMemberRecordItem) => void;
}

export const MemberRecordsSection: React.FC<MemberRecordsSectionProps> = ({
  keywordInput,
  roleFilter,
  sortPreset,
  sorting,
  recordPagination,
  recordPage,
  isRecordLoading,
  selectedMemberId,
  formatDateTime,
  onKeywordInputChange,
  onRoleFilterChange,
  onSortPresetChange,
  onSortingChange,
  onPaginationChange,
  onSearch,
  onSelectMember,
}) => {
  const columns = useMemo<ColumnDef<AdminMemberRecordItem>[]>(() => {
    return [
      {
        id: "id",
        accessorKey: "snapshotStudentId",
        header: "학번",
        enableSorting: true,
        cell: ({ row }) => row.original.snapshotStudentId ?? "-",
      },
      {
        id: "name",
        accessorKey: "snapshotName",
        header: "이름",
        enableSorting: true,
      },
      {
        id: "email",
        accessorKey: "snapshotEmail",
        header: "이메일",
        cell: ({ row }) => (
          <div className="max-w-[220px] truncate">
            {row.original.snapshotEmail}
          </div>
        ),
      },
      {
        id: "role",
        accessorKey: "snapshotRole",
        header: "역할",
      },
      {
        id: "department",
        accessorKey: "snapshotDepartment",
        header: "학과",
        cell: ({ row }) => row.original.snapshotDepartment ?? "-",
      },
      {
        id: "grade",
        accessorKey: "snapshotGrade",
        header: "학년",
        cell: ({ row }) => row.original.snapshotGrade ?? "-",
      },
      {
        id: "recordSource",
        accessorKey: "recordSource",
        header: "기록 출처",
      },
      {
        id: "paymentCompletedAt",
        accessorKey: "paymentCompletedAt",
        header: "결제 완료 시각",
        cell: ({ row }) => formatDateTime(row.original.paymentCompletedAt),
      },
    ];
  }, [formatDateTime]);

  return (
    <Card>
      <CardContent className="space-y-4 p-5">
        <div className="flex flex-wrap items-center gap-2">
          <Input
            value={keywordInput}
            onChange={(event) => onKeywordInputChange(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === "Enter") {
                onSearch();
              }
            }}
            placeholder="이름/학번/이메일 검색"
            className="w-[280px]"
          />

          <Select
            value={roleFilter}
            onValueChange={(value) =>
              onRoleFilterChange(value as MemberRoleFilter)
            }
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
            value={sortPreset}
            onValueChange={(value) =>
              onSortPresetChange(value as MemberSortPreset)
            }
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

          <Button onClick={onSearch}>검색</Button>
        </div>

        <AdminDataTable
          columns={columns}
          data={recordPage?.content ?? []}
          sorting={sorting}
          onSortingChange={onSortingChange}
          pagination={recordPagination}
          onPaginationChange={onPaginationChange}
          pageCount={recordPage?.totalPages ?? 1}
          totalElements={recordPage?.totalElements ?? 0}
          isLoading={isRecordLoading}
          loadingMessage="회원 기록을 조회하는 중입니다."
          emptyMessage="조회 결과가 없습니다."
          getRowId={(row) => String(row.memberRecordId)}
          onRowClick={onSelectMember}
          rowClassName={(row) =>
            selectedMemberId === row.memberRecordId ? "bg-accent" : undefined
          }
        />
      </CardContent>
    </Card>
  );
};
