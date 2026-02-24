import type { AdminPointLedgerPage } from "@/api/point/types"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"

import type { PointTransactionFilter } from "../hooks/usePointPageState"

type PointLedgerSectionProps = {
  isLedgerLoading: boolean
  ledgerData: AdminPointLedgerPage | null
  ledgerPage: number
  ledgerMemberKeyword: string
  ledgerTransactionType: PointTransactionFilter
  ledgerFrom: string
  ledgerTo: string
  onLedgerMemberKeywordChange: (value: string) => void
  onLedgerTransactionTypeChange: (value: PointTransactionFilter) => void
  onLedgerFromChange: (value: string) => void
  onLedgerToChange: (value: string) => void
  onLedgerSearch: () => Promise<void>
  onMoveLedgerPage: (nextPage: number) => Promise<void>
  formatDateTime: (value: string) => string
}

export const PointLedgerSection: React.FC<PointLedgerSectionProps> = ({
  isLedgerLoading,
  ledgerData,
  ledgerPage,
  ledgerMemberKeyword,
  ledgerTransactionType,
  ledgerFrom,
  ledgerTo,
  onLedgerMemberKeywordChange,
  onLedgerTransactionTypeChange,
  onLedgerFromChange,
  onLedgerToChange,
  onLedgerSearch,
  onMoveLedgerPage,
  formatDateTime,
}) => {
  return (
    <Card>
      <CardHeader>
        <CardTitle>통합 포인트 원장</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-1 gap-3 md:grid-cols-6">
          <Input
            value={ledgerMemberKeyword}
            onChange={(event) => onLedgerMemberKeywordChange(event.target.value)}
            placeholder="회원명/학번"
          />

          <Select
            value={ledgerTransactionType}
            onValueChange={(value) => onLedgerTransactionTypeChange(value as PointTransactionFilter)}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ALL">전체 유형</SelectItem>
              <SelectItem value="EARN">적립</SelectItem>
              <SelectItem value="SPEND">차감</SelectItem>
            </SelectContent>
          </Select>

          <Input type="date" value={ledgerFrom} onChange={(event) => onLedgerFromChange(event.target.value)} />
          <Input type="date" value={ledgerTo} onChange={(event) => onLedgerToChange(event.target.value)} />
          <Button onClick={() => void onLedgerSearch()} disabled={isLedgerLoading}>
            조회
          </Button>
        </div>

        <div className="overflow-x-auto rounded-lg border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>시간</TableHead>
                <TableHead>회원</TableHead>
                <TableHead>학번</TableHead>
                <TableHead>유형</TableHead>
                <TableHead>금액</TableHead>
                <TableHead>사유</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {ledgerData?.content.map((row) => (
                <TableRow key={row.pointTransactionId}>
                  <TableCell>{formatDateTime(row.createdAt)}</TableCell>
                  <TableCell>{row.memberName}</TableCell>
                  <TableCell>{row.studentId ?? "-"}</TableCell>
                  <TableCell>{row.transactionType === "EARN" ? "적립" : "차감"}</TableCell>
                  <TableCell>{row.amount}</TableCell>
                  <TableCell>{row.reason}</TableCell>
                </TableRow>
              ))}

              {(ledgerData?.content.length ?? 0) === 0 && (
                <TableRow>
                  <TableCell colSpan={6} className="h-16 text-center text-muted-foreground">
                    {isLedgerLoading ? "원장을 불러오는 중..." : "조회 결과가 없습니다."}
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>

        <div className="flex flex-wrap items-center justify-between gap-2 text-sm">
          <span className="text-muted-foreground">
            총 {ledgerData?.totalElements ?? 0}건 / {ledgerData ? ledgerData.page + 1 : 1}페이지
          </span>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => void onMoveLedgerPage(ledgerPage - 1)}
              disabled={isLedgerLoading || ledgerPage <= 0}
            >
              이전
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => void onMoveLedgerPage(ledgerPage + 1)}
              disabled={isLedgerLoading || !(ledgerData?.hasNext ?? false)}
            >
              다음
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
