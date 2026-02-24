import { useCallback, useEffect, useMemo, useState, type Dispatch, type FormEvent, type SetStateAction } from "react"

import { deleteActivity } from "@/api/activity/delete-acitivites"
import { GetActivities } from "@/api/activity/get-activities"
import { PostMemberActivities as createActivity } from "@/api/activity/post-activities"
import { getActivityById, updateActivity } from "@/api/activity/put-activities"
import type { Activity } from "@/api/activity/types"
import { resolveAdminErrorMessage } from "@/lib/errors/admin-error"
import { showError, showSuccess, showWarning } from "@/utils/alert"

export interface EventRow {
  id: number
  name: string
  amount: number
}

interface UseEventPageStateResult {
  isLoading: boolean
  searchText: string
  isSortAsc: boolean
  rows: EventRow[]
  showEditDialog: boolean
  setShowEditDialog: Dispatch<SetStateAction<boolean>>
  editingActivityId: number | null
  eventName: string
  setEventName: Dispatch<SetStateAction<string>>
  pointAmount: string
  setPointAmount: Dispatch<SetStateAction<string>>
  qrActivityId: number | null
  setSearchText: Dispatch<SetStateAction<string>>
  toggleSortOrder: () => void
  handleCloseQR: () => void
  handleOpenQR: (eventId: number) => void
  handleOpenCreateDialog: () => void
  handleOpenEditDialog: (activityId: number) => Promise<void>
  handleDelete: (activityId: number) => Promise<void>
  handleSubmitEvent: (event: FormEvent<HTMLFormElement>) => Promise<void>
}

export const useEventPageState = (): UseEventPageStateResult => {
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
    const response = await GetActivities()
    if (!response.ok || !response.data) {
      setActivities([])
      showError(resolveAdminErrorMessage(response.errorName, { fallback: "활동 목록을 불러올 수 없습니다." }))
      setIsLoading(false)
      return
    }

    setActivities(response.data)
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

  const toggleSortOrder = useCallback(() => {
    setIsSortAsc((prev) => !prev)
  }, [])

  const handleCloseQR = useCallback(() => {
    const url = new URL(window.location.href)
    url.searchParams.delete("id")
    window.history.pushState({}, "", url)

    setQrActivityId(null)
  }, [])

  const handleOpenQR = useCallback((eventId: number) => {
    localStorage.setItem("currentActivityId", eventId.toString())

    const url = new URL(window.location.href)
    url.searchParams.set("id", eventId.toString())
    window.history.pushState({}, "", url)

    setQrActivityId(eventId)
  }, [])

  const handleOpenCreateDialog = useCallback(() => {
    setEditingActivityId(null)
    setEventName("")
    setPointAmount("")
    setShowEditDialog(true)
  }, [])

  const handleOpenEditDialog = useCallback(
    async (activityId: number) => {
      const currentRow = rows.find((row) => row.id === activityId)

      if (currentRow) {
        setEditingActivityId(activityId)
        setEventName(currentRow.name)
        setPointAmount(String(currentRow.amount))
        setShowEditDialog(true)
        return
      }

      const response = await getActivityById(activityId)
      if (!response.ok || !response.data) {
        showError(resolveAdminErrorMessage(response.errorName, { fallback: "활동 정보를 불러올 수 없습니다." }))
        return
      }

      setEditingActivityId(activityId)
      setEventName(response.data.name)
      setPointAmount(String(response.data.pointAmount))
      setShowEditDialog(true)
    },
    [rows],
  )

  const handleDelete = useCallback(
    async (activityId: number) => {
      const confirmed = await showWarning("정말로 이 활동을 삭제하시겠습니까?")
      if (!confirmed) {
        return
      }

      const response = await deleteActivity(activityId)
      if (!response.ok) {
        showError(resolveAdminErrorMessage(response.errorName, { fallback: "삭제에 실패했습니다." }))
        return
      }

      showSuccess("활동이 삭제되었습니다.")
      await loadActivities()
    },
    [loadActivities],
  )

  const handleSubmitEvent = useCallback(
    async (event: FormEvent<HTMLFormElement>) => {
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
        const response = await updateActivity(editingActivityId, eventName.trim(), pointValue)
        if (!response.ok) {
          showError(resolveAdminErrorMessage(response.errorName, { fallback: "행사 수정에 실패했습니다." }))
          return
        }

        showSuccess("행사가 수정되었습니다.")
      } else {
        const response = await createActivity(eventName.trim(), pointValue)
        if (!response.ok) {
          showError(resolveAdminErrorMessage(response.errorName, { fallback: "행사 생성에 실패했습니다." }))
          return
        }

        showSuccess("행사가 생성되었습니다.")
      }

      setShowEditDialog(false)
      await loadActivities()
    },
    [editingActivityId, eventName, loadActivities, pointAmount],
  )

  return {
    isLoading,
    searchText,
    isSortAsc,
    rows,
    showEditDialog,
    setShowEditDialog,
    editingActivityId,
    eventName,
    setEventName,
    pointAmount,
    setPointAmount,
    qrActivityId,
    setSearchText,
    toggleSortOrder,
    handleCloseQR,
    handleOpenQR,
    handleOpenCreateDialog,
    handleOpenEditDialog,
    handleDelete,
    handleSubmitEvent,
  }
}
