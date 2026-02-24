import { QrCode } from "lucide-react"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"

import type { EventRow } from "../hooks/useEventPageState"

interface EventTableSectionProps {
  isLoading: boolean
  rows: EventRow[]
  onOpenEditDialog: (activityId: number) => Promise<void>
  onDelete: (activityId: number) => Promise<void>
  onOpenQR: (eventId: number) => void
}

export const EventTableSection = ({
  isLoading,
  rows,
  onOpenEditDialog,
  onDelete,
  onOpenQR,
}: EventTableSectionProps) => {
  return (
    <Card>
      <CardContent className="p-0">
        <div className="overflow-x-auto rounded-lg border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-20 text-center">ID</TableHead>
                <TableHead>행사 이름</TableHead>
                <TableHead className="w-28 text-right">포인트</TableHead>
                <TableHead className="w-[320px] text-right">동작</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading && (
                <TableRow>
                  <TableCell colSpan={4} className="h-20 text-center text-muted-foreground">
                    데이터를 불러오는 중입니다.
                  </TableCell>
                </TableRow>
              )}

              {!isLoading && rows.length === 0 && (
                <TableRow>
                  <TableCell colSpan={4} className="h-20 text-center text-muted-foreground">
                    조건에 맞는 행사가 없습니다.
                  </TableCell>
                </TableRow>
              )}

              {!isLoading &&
                rows.map((row) => (
                  <TableRow key={row.id}>
                    <TableCell className="text-center font-medium">{row.id}</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <span>{row.name}</span>
                      </div>
                    </TableCell>
                    <TableCell className="text-right">
                      <Badge variant="secondary">{row.amount}</Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex justify-end gap-2">
                        <Button variant="outline" size="sm" onClick={() => void onOpenEditDialog(row.id)}>
                          수정
                        </Button>
                        <Button variant="destructive" size="sm" onClick={() => void onDelete(row.id)}>
                          삭제
                        </Button>
                        <Button size="sm" onClick={() => onOpenQR(row.id)}>
                          <QrCode className="size-4" />
                          QR
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  )
}
