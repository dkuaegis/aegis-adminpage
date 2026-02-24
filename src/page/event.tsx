import { useCallback, useEffect, useMemo, useState } from "react"
import { QrCode, Search } from "lucide-react"

import { deleteActivity } from "@/api/activity/delete-acitivites"
import { GetActivities, type Activity } from "@/api/activity/get-activities"
import { PostMemberActivities as createActivity } from "@/api/activity/post-activities"
import { getActivityById, updateActivity } from "@/api/activity/put-activities"
import QRScannerComponent from "@/components/QRScanner"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
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
import { showError, showSuccess, showWarning } from "@/utils/alert"

interface EventRow {
  id: number
  name: string
  amount: number
}

const Event: React.FC = () => {
  const [activities, setActivities] = useState<Activity[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [searchText, setSearchText] = useState("")
  const [isSortAsc, setIsSortAsc] = useState(true)

  const [showEditDialog, setShowEditDialog] = useState(false)
  const [editingActivityId, setEditingActivityId] = useState<number | null>(null)
  const [eventName, setEventName] = useState("")
  const [pointAmount, setPointAmount] = useState("")

  const [qrActivityId, setQrActivityId] = useState<number | null>(null)

  const loadActivities = useCallback(async () => {
    setIsLoading(true)
    const data = await GetActivities()
    setActivities(data)
    setIsLoading(false)
  }, [])

  useEffect(() => {
    void loadActivities()
  }, [loadActivities])

  const rows = useMemo<EventRow[]>(() => {
    const keyword = searchText.trim().toLowerCase()

    const mapped = activities.map((activity) => ({
      id: activity.activityId,
      name: activity.name,
      amount: activity.pointAmount,
    }))

    const filtered = keyword
      ? mapped.filter((row) => {
          return (
            row.name.toLowerCase().includes(keyword) ||
            String(row.id).includes(keyword) ||
            String(row.amount).includes(keyword)
          )
        })
      : mapped

    return filtered.sort((a, b) => (isSortAsc ? a.id - b.id : b.id - a.id))
  }, [activities, isSortAsc, searchText])

  const handleCloseQR = () => {
    const url = new URL(window.location.href)
    url.searchParams.delete("id")
    window.history.pushState({}, "", url)

    setQrActivityId(null)
  }

  const handleOpenQR = (eventId: number) => {
    localStorage.setItem("currentActivityId", eventId.toString())

    const url = new URL(window.location.href)
    url.searchParams.set("id", eventId.toString())
    window.history.pushState({}, "", url)

    setQrActivityId(eventId)
  }

  const handleOpenCreateDialog = () => {
    setEditingActivityId(null)
    setEventName("")
    setPointAmount("")
    setShowEditDialog(true)
  }

  const handleOpenEditDialog = async (activityId: number) => {
    const currentRow = rows.find((row) => row.id === activityId)

    if (currentRow) {
      setEditingActivityId(activityId)
      setEventName(currentRow.name)
      setPointAmount(String(currentRow.amount))
      setShowEditDialog(true)
      return
    }

    const activity = await getActivityById(activityId)
    if (!activity) {
      showError("활동 정보를 불러올 수 없습니다.")
      return
    }

    setEditingActivityId(activityId)
    setEventName(activity.name)
    setPointAmount(String(activity.pointAmount))
    setShowEditDialog(true)
  }

  const handleDelete = async (activityId: number) => {
    const confirmed = await showWarning("정말로 이 활동을 삭제하시겠습니까?")
    if (!confirmed) {
      return
    }

    const success = await deleteActivity(activityId)
    if (!success) {
      showError("삭제에 실패했습니다.")
      return
    }

    showSuccess("활동이 삭제되었습니다.")
    await loadActivities()
  }

  const handleSubmitEvent = async (event: React.FormEvent) => {
    event.preventDefault()

    if (!eventName.trim()) {
      showError("행사 이름을 입력하세요.")
      return
    }

    const pointValue = Number(pointAmount)
    if (!Number.isInteger(pointValue) || pointValue < 0) {
      showError("올바른 포인트 값을 입력하세요.")
      return
    }

    if (editingActivityId) {
      const success = await updateActivity(editingActivityId, eventName.trim(), pointValue)
      if (!success) {
        showError("행사 수정에 실패했습니다.")
        return
      }

      showSuccess("행사가 수정되었습니다.")
    } else {
      const success = await createActivity(eventName.trim(), pointValue)
      if (!success) {
        showError("행사 생성에 실패했습니다.")
        return
      }

      showSuccess("행사가 생성되었습니다.")
    }

    setShowEditDialog(false)
    await loadActivities()
  }

  return (
    <div className="space-y-5">
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
              onChange={(event) => setSearchText(event.target.value)}
            />
          </div>
          <Button variant="outline" onClick={() => setIsSortAsc((prev) => !prev)}>
            정렬: {isSortAsc ? "오름차순" : "내림차순"}
          </Button>
          <Button onClick={handleOpenCreateDialog}>행사 생성</Button>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-0">
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
                        <Button variant="outline" size="sm" onClick={() => void handleOpenEditDialog(row.id)}>
                          수정
                        </Button>
                        <Button variant="destructive" size="sm" onClick={() => void handleDelete(row.id)}>
                          삭제
                        </Button>
                        <Button size="sm" onClick={() => handleOpenQR(row.id)}>
                          <QrCode className="size-4" />
                          QR
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Dialog open={showEditDialog} onOpenChange={setShowEditDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editingActivityId ? "행사 수정" : "행사 생성"}</DialogTitle>
            <DialogDescription>
              {editingActivityId
                ? "수정하고 싶은 행사 정보를 입력해주세요."
                : "생성하고 싶은 행사 정보를 입력해주세요."}
            </DialogDescription>
          </DialogHeader>

          <form className="space-y-4" onSubmit={handleSubmitEvent}>
            <div className="space-y-2">
              <Label htmlFor="event-name">행사 이름</Label>
              <Input
                id="event-name"
                value={eventName}
                onChange={(event) => setEventName(event.target.value)}
                placeholder="행사 이름을 입력하세요"
                autoFocus
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="point-amount">포인트</Label>
              <Input
                id="point-amount"
                type="number"
                min={0}
                value={pointAmount}
                onChange={(event) => setPointAmount(event.target.value)}
                placeholder="포인트를 입력하세요"
              />
            </div>

            <div className="flex justify-end gap-2">
              <Button type="button" variant="outline" onClick={() => setShowEditDialog(false)}>
                취소
              </Button>
              <Button type="submit">{editingActivityId ? "수정하기" : "생성하기"}</Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      <Dialog open={qrActivityId !== null} onOpenChange={(open) => !open && handleCloseQR()}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>QR 코드 스캔</DialogTitle>
            <DialogDescription>
              활동 ID {qrActivityId ?? "-"} 출석 체크를 진행합니다.
            </DialogDescription>
          </DialogHeader>
          <QRScannerComponent onClose={handleCloseQR} />
        </DialogContent>
      </Dialog>
    </div>
  )
}

export default Event
