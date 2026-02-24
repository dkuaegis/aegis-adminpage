import type {
  ColumnDef,
  PaginationState,
  SortingState,
  Updater,
} from "@tanstack/react-table";
import { useMemo } from "react";

import type {
  AdminCoupon,
  AdminCouponCode,
  AdminCouponCodePageResponse,
} from "@/api/coupon/types";
import { AdminDataTable } from "@/components/admin";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface CouponCodeTabSectionProps {
  coupons: AdminCoupon[];
  selectedCouponIdForCode: number;
  onSelectedCouponIdForCodeChange: (couponId: number) => void;
  newCouponCodeDescription: string;
  onNewCouponCodeDescriptionChange: (description: string) => void;
  onCreateCouponCode: () => Promise<void>;
  couponCodePage: AdminCouponCodePageResponse | null;
  onDeleteCouponCode: (codeCouponId: number) => Promise<void>;
  formatDateTime: (value: string | null) => string;
  sorting: SortingState;
  onSortingChange: (updater: Updater<SortingState>) => void;
  pagination: PaginationState;
  onPaginationChange: (updater: Updater<PaginationState>) => void;
  isLoading: boolean;
}

export const CouponCodeTabSection: React.FC<CouponCodeTabSectionProps> = ({
  coupons,
  selectedCouponIdForCode,
  onSelectedCouponIdForCodeChange,
  newCouponCodeDescription,
  onNewCouponCodeDescriptionChange,
  onCreateCouponCode,
  couponCodePage,
  onDeleteCouponCode,
  formatDateTime,
  sorting,
  onSortingChange,
  pagination,
  onPaginationChange,
  isLoading,
}) => {
  const columns = useMemo<ColumnDef<AdminCouponCode>[]>(() => {
    return [
      {
        id: "id",
        accessorKey: "codeCouponId",
        header: "코드 ID",
        enableSorting: true,
      },
      {
        id: "couponId",
        accessorKey: "couponId",
        header: "쿠폰 ID",
        enableSorting: true,
      },
      {
        id: "code",
        accessorKey: "code",
        header: "코드",
        enableSorting: true,
        cell: ({ row }) => (
          <div className="max-w-[200px] truncate">{row.original.code}</div>
        ),
      },
      {
        id: "description",
        accessorKey: "description",
        header: "설명",
        cell: ({ row }) => (
          <div
            className="max-w-[260px] truncate"
            title={row.original.description ?? ""}
          >
            {row.original.description ?? "-"}
          </div>
        ),
      },
      {
        id: "status",
        header: "상태",
        cell: ({ row }) =>
          row.original.isValid
            ? "사용 가능"
            : `사용 완료 (${row.original.couponName})`,
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
            onClick={() => void onDeleteCouponCode(row.original.codeCouponId)}
            disabled={!row.original.isValid}
          >
            삭제
          </Button>
        ),
      },
    ];
  }, [formatDateTime, onDeleteCouponCode]);

  return (
    <>
      <Card>
        <CardContent className="flex flex-wrap items-end gap-3 p-5">
          <div className="min-w-[260px] space-y-2">
            <Label>코드 생성 대상 쿠폰</Label>
            <Select
              value={
                selectedCouponIdForCode ? String(selectedCouponIdForCode) : ""
              }
              onValueChange={(value) =>
                onSelectedCouponIdForCodeChange(Number(value))
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
          <div className="min-w-[320px] flex-1 space-y-2">
            <Label>설명 (선택)</Label>
            <Input
              value={newCouponCodeDescription}
              onChange={(event) =>
                onNewCouponCodeDescriptionChange(event.target.value)
              }
              placeholder="예) 26학번 단톡방 공지용"
              maxLength={255}
            />
          </div>
          <Button onClick={() => void onCreateCouponCode()}>코드 생성</Button>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-0">
          <AdminDataTable
            columns={columns}
            data={couponCodePage?.content ?? []}
            sorting={sorting}
            onSortingChange={onSortingChange}
            pagination={pagination}
            onPaginationChange={onPaginationChange}
            pageCount={couponCodePage?.totalPages ?? 1}
            totalElements={couponCodePage?.totalElements ?? 0}
            isLoading={isLoading}
            loadingMessage="쿠폰 코드 목록을 불러오는 중..."
            emptyMessage="조회 결과가 없습니다."
            getRowId={(row) => String(row.codeCouponId)}
          />
        </CardContent>
      </Card>
    </>
  );
};
