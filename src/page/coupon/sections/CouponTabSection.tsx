import { useMemo, useState } from "react"

import type { AdminCoupon } from "@/api/coupon/types"
import { AdminSortableTableHead } from "@/components/admin"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"

interface CouponTabSectionProps {
  newCouponName: string
  onNewCouponNameChange: (value: string) => void
  newDiscountAmount: string
  onNewDiscountAmountChange: (value: string) => void
  onCreateCoupon: () => Promise<void>
  filteredCoupons: AdminCoupon[]
  couponNameDrafts: Record<number, string>
  onCouponNameDraftChange: (couponId: number, value: string) => void
  onUpdateCouponName: (couponId: number) => Promise<void>
  onDeleteCoupon: (couponId: number) => Promise<void>
}

export const CouponTabSection: React.FC<CouponTabSectionProps> = ({
  newCouponName,
  onNewCouponNameChange,
  newDiscountAmount,
  onNewDiscountAmountChange,
  onCreateCoupon,
  filteredCoupons,
  couponNameDrafts,
  onCouponNameDraftChange,
  onUpdateCouponName,
  onDeleteCoupon,
}) => {
  const [sort, setSort] = useState<"id,asc" | "id,desc" | "name,asc" | "name,desc" | "discount,asc" | "discount,desc">(
    "id,asc",
  )

  const sortedCoupons = useMemo(() => {
    const [sortKey, direction] = sort.split(",") as ["id" | "name" | "discount", "asc" | "desc"]
    const sorted = [...filteredCoupons].sort((left, right) => {
      if (sortKey === "id") {
        return left.couponId - right.couponId
      }
      if (sortKey === "name") {
        return left.couponName.localeCompare(right.couponName, "ko")
      }
      return Number(left.discountAmount) - Number(right.discountAmount)
    })

    return direction === "asc" ? sorted : sorted.reverse()
  }, [filteredCoupons, sort])

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
              onChange={(event) => onNewDiscountAmountChange(event.target.value)}
            />
          </div>
          <Button onClick={() => void onCreateCoupon()}>쿠폰 생성</Button>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-0">
          <div className="overflow-x-auto rounded-lg border">
            <Table>
              <TableHeader>
                <TableRow>
                  <AdminSortableTableHead title="ID" sortKey="id" sort={sort} onSortChange={(nextSort) => setSort(nextSort as typeof sort)} />
                  <AdminSortableTableHead title="쿠폰 이름" sortKey="name" sort={sort} onSortChange={(nextSort) => setSort(nextSort as typeof sort)} />
                  <AdminSortableTableHead
                    title="할인 금액"
                    sortKey="discount"
                    sort={sort}
                    onSortChange={(nextSort) => setSort(nextSort as typeof sort)}
                    className="text-right"
                  />
                  <TableHead className="w-[280px]">이름 수정</TableHead>
                  <TableHead className="w-28 text-right">삭제</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {sortedCoupons.map((coupon) => (
                  <TableRow key={coupon.couponId}>
                    <TableCell>{coupon.couponId}</TableCell>
                    <TableCell>{coupon.couponName}</TableCell>
                    <TableCell className="text-right">
                      {Number(coupon.discountAmount).toLocaleString("ko-KR")}원
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-2">
                        <Input
                          value={couponNameDrafts[coupon.couponId] ?? coupon.couponName}
                          onChange={(event) => onCouponNameDraftChange(coupon.couponId, event.target.value)}
                        />
                        <Button variant="outline" onClick={() => void onUpdateCouponName(coupon.couponId)}>
                          저장
                        </Button>
                      </div>
                    </TableCell>
                    <TableCell className="text-right">
                      <Button
                        variant="destructive"
                        size="sm"
                        onClick={() => void onDeleteCoupon(coupon.couponId)}
                      >
                        삭제
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </>
  )
}
