import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"

interface CouponPageHeaderProps {
  searchText: string
  onSearchTextChange: (value: string) => void
}

export const CouponPageHeader: React.FC<CouponPageHeaderProps> = ({
  searchText,
  onSearchTextChange,
}) => {
  return (
    <Card>
      <CardHeader className="flex flex-row flex-wrap items-end justify-between gap-3">
        <div>
          <CardTitle className="text-2xl">쿠폰 관리</CardTitle>
          <CardDescription>쿠폰, 쿠폰 코드, 발급된 쿠폰을 한 화면에서 관리합니다.</CardDescription>
        </div>
        <Input
          className="max-w-sm"
          value={searchText}
          onChange={(event) => onSearchTextChange(event.target.value)}
          placeholder="ID, 쿠폰명, 회원명, 학번, 이메일, 코드, 설명 검색"
        />
      </CardHeader>
    </Card>
  )
}
