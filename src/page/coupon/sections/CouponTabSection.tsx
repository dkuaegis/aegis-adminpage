import type { AdminCoupon } from "@/api/coupon/types"
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
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-24">ID</TableHead>
                <TableHead>쿠폰 이름</TableHead>
                <TableHead className="w-36 text-right">할인 금액</TableHead>
                <TableHead className="w-[280px]">이름 수정</TableHead>
                <TableHead className="w-28 text-right">삭제</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredCoupons.map((coupon) => (
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
        </CardContent>
      </Card>
    </>
  )
}
