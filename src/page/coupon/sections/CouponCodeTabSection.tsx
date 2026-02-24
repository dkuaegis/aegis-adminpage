import { useMemo, useState } from "react"

import type { AdminCoupon, AdminCouponCode } from "@/api/coupon/types"
import { AdminSortableTableHead } from "@/components/admin"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
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

interface CouponCodeTabSectionProps {
  coupons: AdminCoupon[]
  selectedCouponIdForCode: number
  onSelectedCouponIdForCodeChange: (couponId: number) => void
  newCouponCodeDescription: string
  onNewCouponCodeDescriptionChange: (description: string) => void
  onCreateCouponCode: () => Promise<void>
  filteredCouponCodes: AdminCouponCode[]
  onDeleteCouponCode: (codeCouponId: number) => Promise<void>
  formatDateTime: (value: string | null) => string
}

export const CouponCodeTabSection: React.FC<CouponCodeTabSectionProps> = ({
  coupons,
  selectedCouponIdForCode,
  onSelectedCouponIdForCodeChange,
  newCouponCodeDescription,
  onNewCouponCodeDescriptionChange,
  onCreateCouponCode,
  filteredCouponCodes,
  onDeleteCouponCode,
  formatDateTime,
}) => {
  const [sort, setSort] = useState<
    "id,asc" | "id,desc" | "couponId,asc" | "couponId,desc" | "code,asc" | "code,desc" | "usedAt,asc" | "usedAt,desc"
  >("id,asc")

  const sortedCouponCodes = useMemo(() => {
    const [sortKey, direction] = sort.split(",") as ["id" | "couponId" | "code" | "usedAt", "asc" | "desc"]
    const sorted = [...filteredCouponCodes].sort((left, right) => {
      if (sortKey === "id") {
        return left.codeCouponId - right.codeCouponId
      }
      if (sortKey === "couponId") {
        return left.couponId - right.couponId
      }
      if (sortKey === "code") {
        return left.code.localeCompare(right.code, "ko")
      }

      const leftValue = left.usedAt ? new Date(left.usedAt).getTime() : Number.POSITIVE_INFINITY
      const rightValue = right.usedAt ? new Date(right.usedAt).getTime() : Number.POSITIVE_INFINITY
      return leftValue - rightValue
    })

    return direction === "asc" ? sorted : sorted.reverse()
  }, [filteredCouponCodes, sort])

  return (
    <>
      <Card>
        <CardContent className="flex flex-wrap items-end gap-3 p-5">
          <div className="min-w-[260px] space-y-2">
            <Label>코드 생성 대상 쿠폰</Label>
            <Select
              value={selectedCouponIdForCode ? String(selectedCouponIdForCode) : ""}
              onValueChange={(value) => onSelectedCouponIdForCodeChange(Number(value))}
            >
              <SelectTrigger>
                <SelectValue placeholder="쿠폰 선택" />
              </SelectTrigger>
              <SelectContent>
                {coupons.map((coupon) => (
                  <SelectItem key={coupon.couponId} value={String(coupon.couponId)}>
                    [{coupon.couponId}] {coupon.couponName} ({Number(coupon.discountAmount).toLocaleString("ko-KR")}원)
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="min-w-[320px] flex-1 space-y-2">
            <Label>설명 (선택)</Label>
            <Input
              value={newCouponCodeDescription}
              onChange={(event) => onNewCouponCodeDescriptionChange(event.target.value)}
              placeholder="예) 26학번 단톡방 공지용"
              maxLength={255}
            />
          </div>
          <Button onClick={() => void onCreateCouponCode()}>코드 생성</Button>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-0">
          <div className="overflow-x-auto rounded-lg border">
            <Table>
              <TableHeader>
                <TableRow>
                  <AdminSortableTableHead title="코드 ID" sortKey="id" sort={sort} onSortChange={(nextSort) => setSort(nextSort as typeof sort)} />
                  <AdminSortableTableHead
                    title="쿠폰 ID"
                    sortKey="couponId"
                    sort={sort}
                    onSortChange={(nextSort) => setSort(nextSort as typeof sort)}
                  />
                  <AdminSortableTableHead title="코드" sortKey="code" sort={sort} onSortChange={(nextSort) => setSort(nextSort as typeof sort)} />
                  <TableHead>설명</TableHead>
                  <TableHead>상태</TableHead>
                  <AdminSortableTableHead
                    title="사용 시각"
                    sortKey="usedAt"
                    sort={sort}
                    onSortChange={(nextSort) => setSort(nextSort as typeof sort)}
                    defaultDirection="desc"
                  />
                  <TableHead className="text-right">삭제</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {sortedCouponCodes.map((couponCode) => (
                  <TableRow key={couponCode.codeCouponId}>
                    <TableCell>{couponCode.codeCouponId}</TableCell>
                    <TableCell>{couponCode.couponId}</TableCell>
                    <TableCell className="max-w-[200px] truncate">{couponCode.code}</TableCell>
                    <TableCell className="max-w-[260px] truncate" title={couponCode.description ?? ""}>
                      {couponCode.description ?? "-"}
                    </TableCell>
                    <TableCell>{couponCode.isValid ? "사용 가능" : `사용 완료 (${couponCode.couponName})`}</TableCell>
                    <TableCell>{formatDateTime(couponCode.usedAt)}</TableCell>
                    <TableCell className="text-right">
                      <Button
                        variant="destructive"
                        size="sm"
                        onClick={() => void onDeleteCouponCode(couponCode.codeCouponId)}
                        disabled={!couponCode.isValid}
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
