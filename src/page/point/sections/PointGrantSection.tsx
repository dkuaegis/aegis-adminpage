import type { AdminPointBatchGrantResult, AdminPointMemberSearch } from "@/api/point/types"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Textarea } from "@/components/ui/textarea"

type PointGrantSectionProps = {
  memberSearchResults: AdminPointMemberSearch[]
  singleMemberId: number | null
  singleAmount: string
  singleReason: string
  isSingleSubmitting: boolean
  selectedBatchMemberIds: number[]
  selectedBatchMembers: AdminPointMemberSearch[]
  batchAmount: string
  batchReason: string
  isBatchSubmitting: boolean
  batchResult: AdminPointBatchGrantResult | null
  onSingleMemberIdChange: (memberId: number | null) => void
  onSingleAmountChange: (value: string) => void
  onSingleReasonChange: (value: string) => void
  onSingleGrant: () => Promise<void>
  onBatchAmountChange: (value: string) => void
  onBatchReasonChange: (value: string) => void
  onBatchGrant: () => Promise<void>
}

export const PointGrantSection: React.FC<PointGrantSectionProps> = ({
  memberSearchResults,
  singleMemberId,
  singleAmount,
  singleReason,
  isSingleSubmitting,
  selectedBatchMemberIds,
  selectedBatchMembers,
  batchAmount,
  batchReason,
  isBatchSubmitting,
  batchResult,
  onSingleMemberIdChange,
  onSingleAmountChange,
  onSingleReasonChange,
  onSingleGrant,
  onBatchAmountChange,
  onBatchReasonChange,
  onBatchGrant,
}) => {
  return (
    <Card>
      <CardHeader>
        <CardTitle>수동 지급</CardTitle>
      </CardHeader>
      <CardContent className="space-y-5">
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
          <div className="space-y-3 rounded-lg border p-4">
            <h3 className="font-semibold">단건 지급</h3>

            <Select
              value={singleMemberId ? String(singleMemberId) : ""}
              onValueChange={(value) => onSingleMemberIdChange(value ? Number(value) : null)}
            >
              <SelectTrigger>
                <SelectValue placeholder="지급 대상 선택" />
              </SelectTrigger>
              <SelectContent>
                {memberSearchResults.map((member) => (
                  <SelectItem key={member.memberId} value={String(member.memberId)}>
                    {member.memberName} ({member.studentId ?? "-"}, ID:{member.memberId})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Input
              type="number"
              min={1}
              step={1}
              value={singleAmount}
              onChange={(event) => onSingleAmountChange(event.target.value)}
              placeholder="지급 포인트"
            />
            <Textarea
              value={singleReason}
              onChange={(event) => onSingleReasonChange(event.target.value)}
              placeholder="지급 사유"
              maxLength={200}
            />
            <Button className="w-full" onClick={() => void onSingleGrant()} disabled={isSingleSubmitting}>
              {isSingleSubmitting ? "지급 중..." : "단건 지급"}
            </Button>
          </div>

          <div className="space-y-3 rounded-lg border p-4">
            <h3 className="font-semibold">일괄 지급 (선택 {selectedBatchMemberIds.length}명)</h3>

            <div className="max-h-28 space-y-1 overflow-y-auto rounded-md border p-2">
              {selectedBatchMembers.length === 0 && <div className="text-sm text-muted-foreground">선택된 회원이 없습니다.</div>}
              {selectedBatchMembers.map((member) => (
                <div key={member.memberId} className="text-sm">
                  {member.memberName} ({member.studentId ?? "-"}, ID:{member.memberId})
                </div>
              ))}
            </div>

            <Input
              type="number"
              min={1}
              step={1}
              value={batchAmount}
              onChange={(event) => onBatchAmountChange(event.target.value)}
              placeholder="지급 포인트"
            />
            <Textarea
              value={batchReason}
              onChange={(event) => onBatchReasonChange(event.target.value)}
              placeholder="지급 사유"
              maxLength={200}
            />
            <Button className="w-full" onClick={() => void onBatchGrant()} disabled={isBatchSubmitting}>
              {isBatchSubmitting ? "일괄 지급 중..." : "일괄 지급"}
            </Button>
          </div>
        </div>

        {batchResult && (
          <div className="space-y-3 rounded-lg border p-4">
            <h3 className="font-semibold">일괄 지급 결과</h3>
            <div className="flex flex-wrap gap-2">
              <Badge variant="secondary">요청 {batchResult.totalRequested}건</Badge>
              <Badge variant="secondary">성공 {batchResult.successCount}</Badge>
              <Badge variant="secondary">중복 {batchResult.duplicateCount}</Badge>
              <Badge variant="secondary">실패 {batchResult.failureCount}</Badge>
            </div>

            <div className="overflow-x-auto rounded-lg border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>회원ID</TableHead>
                    <TableHead>상태</TableHead>
                    <TableHead>거래ID</TableHead>
                    <TableHead>잔액</TableHead>
                    <TableHead>오류</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {batchResult.results.map((result, index) => (
                    <TableRow key={`${result.memberId}-${index}`}>
                      <TableCell>{result.memberId}</TableCell>
                      <TableCell>{result.status}</TableCell>
                      <TableCell>{result.pointTransactionId ?? "-"}</TableCell>
                      <TableCell>{result.newBalance ?? "-"}</TableCell>
                      <TableCell>{result.errorName ?? "-"}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
