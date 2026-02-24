import type {
  ColumnDef,
  PaginationState,
  SortingState,
  Updater,
} from "@tanstack/react-table";
import { useMemo } from "react";

import type { AdminCoupon, AdminCouponPageResponse } from "@/api/coupon/types";
import { AdminDataTable } from "@/components/admin";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

interface CouponTabSectionProps {
  newCouponName: string;
  onNewCouponNameChange: (value: string) => void;
  newDiscountAmount: string;
  onNewDiscountAmountChange: (value: string) => void;
  onCreateCoupon: () => Promise<void>;
  couponPage: AdminCouponPageResponse | null;
  couponNameDrafts: Record<number, string>;
  onCouponNameDraftChange: (couponId: number, value: string) => void;
  onUpdateCouponName: (couponId: number) => Promise<void>;
  onDeleteCoupon: (couponId: number) => Promise<void>;
  sorting: SortingState;
  onSortingChange: (updater: Updater<SortingState>) => void;
  pagination: PaginationState;
  onPaginationChange: (updater: Updater<PaginationState>) => void;
  isLoading: boolean;
}

export const CouponTabSection: React.FC<CouponTabSectionProps> = ({
  newCouponName,
  onNewCouponNameChange,
  newDiscountAmount,
  onNewDiscountAmountChange,
  onCreateCoupon,
  couponPage,
  couponNameDrafts,
  onCouponNameDraftChange,
  onUpdateCouponName,
  onDeleteCoupon,
  sorting,
  onSortingChange,
  pagination,
  onPaginationChange,
  isLoading,
}) => {
  const columns = useMemo<ColumnDef<AdminCoupon>[]>(() => {
    return [
      {
        id: "id",
        accessorKey: "couponId",
        header: "ID",
        enableSorting: true,
      },
      {
        id: "name",
        accessorKey: "couponName",
        header: "쿠폰 이름",
        enableSorting: true,
      },
      {
        id: "discount",
        accessorKey: "discountAmount",
        header: "할인 금액",
        enableSorting: true,
        meta: {
          headerClassName: "text-right",
          cellClassName: "text-right",
        },
        cell: ({ row }) =>
          `${Number(row.original.discountAmount).toLocaleString("ko-KR")}원`,
      },
      {
        id: "rename",
        header: "이름 수정",
        meta: {
          headerClassName: "w-[280px]",
        },
        cell: ({ row }) => (
          <div className="flex gap-2">
            <Input
              value={
                couponNameDrafts[row.original.couponId] ??
                row.original.couponName
              }
              onChange={(event) =>
                onCouponNameDraftChange(
                  row.original.couponId,
                  event.target.value
                )
              }
            />
            <Button
              variant="outline"
              onClick={() => void onUpdateCouponName(row.original.couponId)}
            >
              저장
            </Button>
          </div>
        ),
      },
      {
        id: "delete",
        header: "삭제",
        meta: {
          headerClassName: "w-28 text-right",
          cellClassName: "text-right",
        },
        cell: ({ row }) => (
          <Button
            variant="destructive"
            size="sm"
            onClick={() => void onDeleteCoupon(row.original.couponId)}
          >
            삭제
          </Button>
        ),
      },
    ];
  }, [
    couponNameDrafts,
    onCouponNameDraftChange,
    onDeleteCoupon,
    onUpdateCouponName,
  ]);

  return (
    <>
      <Card>
        <CardContent className="flex flex-wrap items-end gap-3 p-5">
          <div className="min-w-[220px] space-y-2">
            <Label>쿠폰 이름</Label>
            <Input
              value={newCouponName}
              onChange={(event) => onNewCouponNameChange(event.target.value)}
              placeholder="예) 2026 신입생 환영 쿠폰"
            />
          </div>
          <div className="w-[200px] space-y-2">
            <Label>할인 금액</Label>
            <Input
              type="number"
              min={1}
              value={newDiscountAmount}
              onChange={(event) =>
                onNewDiscountAmountChange(event.target.value)
              }
            />
          </div>
          <Button onClick={() => void onCreateCoupon()}>쿠폰 생성</Button>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-0">
          <AdminDataTable
            columns={columns}
            data={couponPage?.content ?? []}
            sorting={sorting}
            onSortingChange={onSortingChange}
            pagination={pagination}
            onPaginationChange={onPaginationChange}
            pageCount={couponPage?.totalPages ?? 1}
            totalElements={couponPage?.totalElements ?? 0}
            isLoading={isLoading}
            loadingMessage="쿠폰 목록을 불러오는 중..."
            emptyMessage="조회 결과가 없습니다."
            getRowId={(row) => String(row.couponId)}
          />
        </CardContent>
      </Card>
    </>
  );
};
