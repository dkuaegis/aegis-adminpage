import type {
  ColumnDef,
  PaginationState,
  SortingState,
  Updater,
} from "@tanstack/react-table";
import { useMemo } from "react";

import type {
  AdminCoupon,
  AdminIssuedCoupon,
  AdminIssuedCouponPageResponse,
  AdminMemberSummary,
} from "@/api/coupon/types";
import { AdminDataTable } from "@/components/admin";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface CouponIssuedTabSectionProps {
  coupons: AdminCoupon[];
  selectedCouponIdForIssue: number;
  onSelectedCouponIdForIssueChange: (couponId: number) => void;
  onCreateIssuedCoupons: () => Promise<void>;
  memberSearchText: string;
  onMemberSearchTextChange: (value: string) => void;
  filteredMembersForIssue: AdminMemberSummary[];
  selectedMemberIdSet: Set<number>;
  isAllFilteredMembersSelected: boolean;
  selectedAmongFilteredCount: number;
  selectedMemberIdsForIssue: number[];
  onSelectAllFilteredMembers: () => void;
  onClearFilteredMembers: () => void;
  onClearAllSelectedMembers: () => void;
  onToggleMemberForIssue: (memberId: number) => void;
  issuedCouponPage: AdminIssuedCouponPageResponse | null;
  onDeleteIssuedCoupon: (issuedCouponId: number) => Promise<void>;
  formatDateTime: (value: string | null) => string;
  sorting: SortingState;
  onSortingChange: (updater: Updater<SortingState>) => void;
  pagination: PaginationState;
  onPaginationChange: (updater: Updater<PaginationState>) => void;
  isLoading: boolean;
}

export const CouponIssuedTabSection: React.FC<CouponIssuedTabSectionProps> = ({
  coupons,
  selectedCouponIdForIssue,
  onSelectedCouponIdForIssueChange,
  onCreateIssuedCoupons,
  memberSearchText,
  onMemberSearchTextChange,
  filteredMembersForIssue,
  selectedMemberIdSet,
  isAllFilteredMembersSelected,
  selectedAmongFilteredCount,
  selectedMemberIdsForIssue,
  onSelectAllFilteredMembers,
  onClearFilteredMembers,
  onClearAllSelectedMembers,
  onToggleMemberForIssue,
  issuedCouponPage,
  onDeleteIssuedCoupon,
  formatDateTime,
  sorting,
  onSortingChange,
  pagination,
  onPaginationChange,
  isLoading,
}) => {
  const columns = useMemo<ColumnDef<AdminIssuedCoupon>[]>(() => {
    return [
      {
        id: "id",
        accessorKey: "issuedCouponId",
        header: "발급 ID",
        enableSorting: true,
      },
      {
        id: "coupon",
        accessorKey: "couponName",
        header: "쿠폰",
        enableSorting: true,
        cell: ({ row }) =>
          `[${row.original.couponId}] ${row.original.couponName} (${Number(row.original.discountAmount).toLocaleString("ko-KR")}원)`,
      },
      {
        id: "member",
        accessorKey: "memberName",
        header: "회원",
        enableSorting: true,
        cell: ({ row }) => (
          <div className="text-sm">
            <div>
              [{row.original.memberId}] {row.original.memberName}
            </div>
            <div className="text-muted-foreground">
              {row.original.memberEmail}
            </div>
          </div>
        ),
      },
      {
        id: "status",
        header: "상태",
        cell: ({ row }) => (row.original.isValid ? "미사용" : "사용됨"),
      },
      {
        id: "paymentId",
        accessorKey: "paymentId",
        header: "결제 ID",
        cell: ({ row }) => row.original.paymentId ?? "-",
      },
      {
        id: "usedAt",
        accessorKey: "usedAt",
        header: "사용 시각",
        enableSorting: true,
        sortDescFirst: true,
        cell: ({ row }) => formatDateTime(row.original.usedAt),
      },
      {
        id: "delete",
        header: "삭제",
        meta: {
          headerClassName: "text-right",
          cellClassName: "text-right",
        },
        cell: ({ row }) => (
          <Button
            variant="destructive"
            size="sm"
            onClick={() =>
              void onDeleteIssuedCoupon(row.original.issuedCouponId)
            }
            disabled={!row.original.isValid}
          >
            삭제
          </Button>
        ),
      },
    ];
  }, [formatDateTime, onDeleteIssuedCoupon]);

  return (
    <>
      <Card>
        <CardContent className="space-y-4 p-5">
          <div className="flex flex-wrap items-end gap-3">
            <div className="min-w-[280px] space-y-2">
              <Label>발급할 쿠폰</Label>
              <Select
                value={
                  selectedCouponIdForIssue
                    ? String(selectedCouponIdForIssue)
                    : ""
                }
                onValueChange={(value) =>
                  onSelectedCouponIdForIssueChange(Number(value))
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="쿠폰 선택" />
                </SelectTrigger>
                <SelectContent>
                  {coupons.map((coupon) => (
                    <SelectItem
                      key={coupon.couponId}
                      value={String(coupon.couponId)}
                    >
                      [{coupon.couponId}] {coupon.couponName} (
                      {Number(coupon.discountAmount).toLocaleString("ko-KR")}원)
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <Button onClick={() => void onCreateIssuedCoupons()}>
              선택 회원 쿠폰 발급
            </Button>
          </div>

          <div className="space-y-2">
            <Label>발급 대상 회원</Label>
            <Input
              value={memberSearchText}
              onChange={(event) => onMemberSearchTextChange(event.target.value)}
              placeholder="회원 ID, 이름, 학번, 이메일, 권한 검색"
            />

            <div className="flex flex-wrap items-center gap-2 text-sm">
              <Button
                variant="outline"
                size="sm"
                onClick={onSelectAllFilteredMembers}
                disabled={
                  filteredMembersForIssue.length === 0 ||
                  isAllFilteredMembersSelected
                }
              >
                검색 결과 전체 선택
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={onClearFilteredMembers}
                disabled={filteredMembersForIssue.length === 0}
              >
                검색 결과 선택 해제
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={onClearAllSelectedMembers}
                disabled={selectedMemberIdsForIssue.length === 0}
              >
                전체 선택 해제
              </Button>
              <Badge variant="secondary">
                총 {filteredMembersForIssue.length}명 중{" "}
                {selectedAmongFilteredCount}명 선택
              </Badge>
              <Badge variant="outline">
                전체 선택 {selectedMemberIdsForIssue.length}명
              </Badge>
            </div>

            <ScrollArea className="h-56 rounded-lg border bg-background p-2">
              {filteredMembersForIssue.length === 0 ? (
                <div className="flex h-full items-center justify-center text-muted-foreground text-sm">
                  검색 조건에 맞는 회원이 없습니다.
                </div>
              ) : (
                <div className="space-y-1">
                  {filteredMembersForIssue.map((member) => (
                    <div
                      key={member.memberId}
                      className="flex items-start gap-3 rounded-md px-2 py-1.5 hover:bg-accent"
                    >
                      <Checkbox
                        aria-label={`${member.name} 회원 선택`}
                        checked={selectedMemberIdSet.has(member.memberId)}
                        onCheckedChange={() =>
                          onToggleMemberForIssue(member.memberId)
                        }
                      />
                      <span className="text-sm">
                        [{member.memberId}] {member.name} (
                        {member.studentId ?? "학번 미입력"}, {member.email}) -{" "}
                        {member.role}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </ScrollArea>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-0">
          <AdminDataTable
            columns={columns}
            data={issuedCouponPage?.content ?? []}
            sorting={sorting}
            onSortingChange={onSortingChange}
            pagination={pagination}
            onPaginationChange={onPaginationChange}
            pageCount={issuedCouponPage?.totalPages ?? 1}
            totalElements={issuedCouponPage?.totalElements ?? 0}
            isLoading={isLoading}
            loadingMessage="발급 쿠폰 목록을 불러오는 중..."
            emptyMessage="조회 결과가 없습니다."
            getRowId={(row) => String(row.issuedCouponId)}
          />
        </CardContent>
      </Card>
    </>
  );
};
