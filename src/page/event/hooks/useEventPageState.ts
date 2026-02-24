import { useCallback, useEffect, useMemo, useState, type Dispatch, type FormEvent, type SetStateAction } from "react"

import type { PaginationState, SortingState, Updater } from "@tanstack/react-table"
import { functionalUpdate } from "@tanstack/react-table"

import { createSortingState, normalizeSingleSorting, serializeSortingState } from "@/components/admin"
import type { ColumnSortMap } from "@/components/admin"
import { deleteActivity } from "@/api/activity/delete-acitivites"
import { GetActivities } from "@/api/activity/get-activities"
import { createActivity } from "@/api/activity/post-activities"
import { getActivityById, updateActivity } from "@/api/activity/put-activities"
import type { Activity, AdminActivityPageResponse } from "@/api/activity/types"
import { resolveAdminErrorMessage } from "@/lib/errors/admin-error"
import { showConfirm, showError, showSuccess } from "@/utils/alert"

const PAGE_SIZE = 50

const EVENT_SORT_MAP: ColumnSortMap = {
  id: "id",
  name: "name",
  pointAmount: "pointAmount",
}

const DEFAULT_EVENT_SORTING = createSortingState("id", false)

export interface EventRow {
  id: number
  name: string
  amount: number
}

interface UseEventPageStateResult {
  isLoading: boolean
  searchDraft: string
  setSearchDraft: Dispatch<SetStateAction<string>>
  appliedKeyword: string
  sorting: SortingState
  pagination: PaginationState
  rows: EventRow[]
  pageData: AdminActivityPageResponse | null
  showEditDialog: boolean
  setShowEditDialog: Dispatch<SetStateAction<boolean>>
  editingActivityId: number | null
  eventName: string
  setEventName: Dispatch<SetStateAction<string>>
  pointAmount: string
  setPointAmount: Dispatch<SetStateAction<string>>
  qrActivityId: number | null
  handleApplySearch: () => void
  handleSortingChange: (updater: Updater<SortingState>) => void
  handlePaginationChange: (updater: Updater<PaginationState>) => void
  handleCloseQR: () => void
  handleOpenQR: (eventId: number) => void
  handleOpenCreateDialog: () => void
  handleOpenEditDialog: (activityId: number) => Promise<void>
  handleDelete: (activityId: number) => Promise<void>
  handleSubmitEvent: (event: FormEvent<HTMLFormElement>) => Promise<void>
}

export const useEventPageState = (): UseEventPageStateResult => {
  const [activityPage, setActivityPage] = useState<AdminActivityPageResponse | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  const [searchDraft, setSearchDraft] = useState("")
  const [appliedKeyword, setAppliedKeyword] = useState("")
  const [sorting, setSorting] = useState<SortingState>(DEFAULT_EVENT_SORTING)
  const [pagination, setPagination] = useState<PaginationState>({
    pageIndex: 0,
    pageSize: PAGE_SIZE,
  })

  const [showEditDialog, setShowEditDialog] = useState(false)
  const [editingActivityId, setEditingActivityId] = useState<number | null>(null)
  const [eventName, setEventName] = useState("")
  const [pointAmount, setPointAmount] = useState("")

  const [qrActivityId, setQrActivityId] = useState<number | null>(null)

  const loadActivities = useCallback(
    async (nextPagination: PaginationState, nextSorting: SortingState, keyword: string) => {
      setIsLoading(true)

      const response = await GetActivities({
        page: nextPagination.pageIndex,
        size: nextPagination.pageSize,
        sort: serializeSortingState(nextSorting, EVENT_SORT_MAP, "id,asc"),
        keyword: keyword || undefined,
      })
      if (!response.ok) {
        setActivityPage(null)
        showError(resolveAdminErrorMessage(response.errorName, { fallback: "활동 목록을 불러올 수 없습니다." }))
        setIsLoading(false)
        return
      }
      const data = response.data
      if (!data) {
        setActivityPage(null)
        showError(resolveAdminErrorMessage(undefined, { fallback: "활동 목록을 불러올 수 없습니다." }))
        setIsLoading(false)
        return
      }

      setActivityPage(data)
      setPagination((prev) => {
        if (prev.pageIndex === data.page && prev.pageSize === data.size) {
          return prev
        }

        return {
          ...prev,
          pageIndex: data.page,
          pageSize: data.size,
        }
      })
      setIsLoading(false)
    },
    [],
  )

  useEffect(() => {
    void loadActivities(pagination, sorting, appliedKeyword)
  }, [pagination.pageIndex, pagination.pageSize, sorting, appliedKeyword])

  const rows = useMemo<EventRow[]>(() => {
    return (activityPage?.content ?? []).map((activity: Activity) => ({
      id: activity.activityId,
      name: activity.name,
      amount: activity.pointAmount,
    }))
  }, [activityPage])

  const handleApplySearch = useCallback(() => {
    setAppliedKeyword(searchDraft.trim())
    setPagination((prev) => ({
      ...prev,
      pageIndex: 0,
    }))
  }, [searchDraft])

  const handleSortingChange = useCallback((updater: Updater<SortingState>) => {
    setSorting((prev) => normalizeSingleSorting(updater, prev, DEFAULT_EVENT_SORTING))
    setPagination((prev) => ({
      ...prev,
      pageIndex: 0,
    }))
  }, [])

  const handlePaginationChange = useCallback(
    (updater: Updater<PaginationState>) => {
      const nextPagination = functionalUpdate(updater, pagination)

      if (nextPagination.pageIndex < 0) {
        return
      }

      if (activityPage && nextPagination.pageIndex >= activityPage.totalPages) {
        return
      }

      setPagination(nextPagination)
    },
    [activityPage, pagination],
  )

  const handleCloseQR = useCallback(() => {
    const url = new URL(window.location.href)
    url.searchParams.delete("id")
    window.history.pushState({}, "", url)

    setQrActivityId(null)
  }, [])

  const handleOpenQR = useCallback((eventId: number) => {
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
      const confirmed = await showConfirm("정말로 이 활동을 삭제하시겠습니까?")
      if (!confirmed) {
        return
      }

      const response = await deleteActivity(activityId)
      if (!response.ok) {
        showError(resolveAdminErrorMessage(response.errorName, { fallback: "삭제에 실패했습니다." }))
        return
      }

      showSuccess("활동이 삭제되었습니다.")
      await loadActivities(pagination, sorting, appliedKeyword)
    },
    [appliedKeyword, loadActivities, pagination, sorting],
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
      await loadActivities(pagination, sorting, appliedKeyword)
    },
    [appliedKeyword, editingActivityId, eventName, loadActivities, pagination, pointAmount, sorting],
  )

  return {
    isLoading,
    searchDraft,
    setSearchDraft,
    appliedKeyword,
    sorting,
    pagination,
    rows,
    pageData: activityPage,
    showEditDialog,
    setShowEditDialog,
    editingActivityId,
    eventName,
    setEventName,
    pointAmount,
    setPointAmount,
    qrActivityId,
    handleApplySearch,
    handleSortingChange,
    handlePaginationChange,
    handleCloseQR,
    handleOpenQR,
    handleOpenCreateDialog,
    handleOpenEditDialog,
    handleDelete,
    handleSubmitEvent,
  }
}
