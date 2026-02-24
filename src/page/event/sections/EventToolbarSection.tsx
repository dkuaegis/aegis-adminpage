import { Search } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"

interface EventToolbarSectionProps {
  searchText: string
  isSortAsc: boolean
  onSearchTextChange: (value: string) => void
  onToggleSortOrder: () => void
  onOpenCreateDialog: () => void
}

export const EventToolbarSection = ({
  searchText,
  isSortAsc,
  onSearchTextChange,
  onToggleSortOrder,
  onOpenCreateDialog,
}: EventToolbarSectionProps) => {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-2xl">행사 관리</CardTitle>
        <CardDescription>행사 CRUD와 QR 출석 체크를 관리합니다.</CardDescription>
      </CardHeader>
      <CardContent className="flex flex-wrap items-center gap-2">
        <div className="relative min-w-[260px] flex-1">
          <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            className="pl-9"
            placeholder="행사명, ID, 포인트 검색"
            value={searchText}
            onChange={(event) => onSearchTextChange(event.target.value)}
          />
        </div>
        <Button variant="outline" onClick={onToggleSortOrder}>
          정렬: {isSortAsc ? "오름차순" : "내림차순"}
        </Button>
        <Button onClick={onOpenCreateDialog}>행사 생성</Button>
      </CardContent>
    </Card>
  )
}
