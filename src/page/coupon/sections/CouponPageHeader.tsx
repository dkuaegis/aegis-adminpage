import { Button } from "@/components/ui/button"
import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"

interface CouponPageHeaderProps {
  searchDraft: string
  appliedKeyword: string
  isLoading: boolean
  onSearchDraftChange: (value: string) => void
  onApplySearch: () => void
}

export const CouponPageHeader: React.FC<CouponPageHeaderProps> = ({
  searchDraft,
  appliedKeyword,
  isLoading,
  onSearchDraftChange,
  onApplySearch,
}) => {
  return (
    <Card>
      <CardHeader className="flex flex-row flex-wrap items-end justify-between gap-3">
        <div>
          <CardTitle className="text-2xl">쿠폰 관리</CardTitle>
          <CardDescription>쿠폰, 쿠폰 코드, 발급된 쿠폰을 한 화면에서 관리합니다.</CardDescription>
          <CardDescription>
            적용된 검색어: {appliedKeyword ? `"${appliedKeyword}"` : "(없음)"}
          </CardDescription>
        </div>

        <div className="flex w-full max-w-xl gap-2">
          <Input
            value={searchDraft}
            onChange={(event) => onSearchDraftChange(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === "Enter") {
                onApplySearch()
              }
            }}
            placeholder="ID, 쿠폰명, 회원명, 학번, 이메일, 코드, 설명 검색"
          />
          <Button onClick={onApplySearch} disabled={isLoading}>
            검색
          </Button>
        </div>
      </CardHeader>
    </Card>
  )
}
