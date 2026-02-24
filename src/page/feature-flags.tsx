import { useCallback, useEffect, useState } from "react"

import { getFeatureFlags } from "@/api/feature-flag/get-feature-flags"
import { updateMemberSignupFlag } from "@/api/feature-flag/put-member-signup"
import { updateStudyCreationFlag } from "@/api/feature-flag/put-study-creation"
import { updateStudyEnrollWindowFlag } from "@/api/feature-flag/put-study-enroll-window"
import type { AdminFeatureFlags } from "@/api/feature-flag/types"
import { AdminFilterBar, AdminPageHeader, AdminSectionCard } from "@/components/admin"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Skeleton } from "@/components/ui/skeleton"
import { resolveAdminErrorMessage } from "@/lib/errors/admin-error"
import { showError, showSuccess } from "@/utils/alert"

function toDateTimeLocalValue(value: string | null): string {
  if (!value) {
    return ""
  }

  if (value.length >= 16) {
    return value.slice(0, 16)
  }

  return ""
}

function toRequestLocalDateTime(value: string): string {
  return value.length === 16 ? `${value}:00` : value
}

function formatDateTime(value: string | null): string {
  if (!value) {
    return "-"
  }

  const parsed = new Date(value)
  if (Number.isNaN(parsed.getTime())) {
    return value
  }

  return parsed.toLocaleString("ko-KR", {
    hour12: false,
  })
}

const featureFlagsErrorOverrides: Record<string, string> = {
  INVALID_STUDY_ENROLL_WINDOW: "신청 시작 시각은 종료 시각보다 빨라야 합니다.",
}

const resolveFeatureFlagsErrorMessage = (errorName?: string): string => {
  return resolveAdminErrorMessage(errorName, { overrides: featureFlagsErrorOverrides })
}

const FeatureFlagsPage: React.FC = () => {
  const [isDataLoading, setIsDataLoading] = useState(false)
  const [savingKey, setSavingKey] = useState<string | null>(null)

  const [flags, setFlags] = useState<AdminFeatureFlags | null>(null)

  const [memberSignupEnabled, setMemberSignupEnabled] = useState(true)
  const [studyCreationEnabled, setStudyCreationEnabled] = useState(true)
  const [enrollOpenAt, setEnrollOpenAt] = useState("")
  const [enrollCloseAt, setEnrollCloseAt] = useState("")

  const applyFlags = useCallback((nextFlags: AdminFeatureFlags): void => {
    setFlags(nextFlags)
    setMemberSignupEnabled(nextFlags.memberSignup.enabled ?? nextFlags.memberSignup.signupAllowed)
    setStudyCreationEnabled(nextFlags.studyCreation.enabled ?? nextFlags.studyCreation.studyCreationAllowed)
    setEnrollOpenAt(toDateTimeLocalValue(nextFlags.studyEnrollWindow.openAtRaw ?? nextFlags.studyEnrollWindow.openAt))
    setEnrollCloseAt(toDateTimeLocalValue(nextFlags.studyEnrollWindow.closeAtRaw ?? nextFlags.studyEnrollWindow.closeAt))
  }, [])

  const loadFlags = useCallback(async (): Promise<void> => {
    setIsDataLoading(true)
    const response = await getFeatureFlags()

    if (!response.ok || !response.data) {
      showError(resolveFeatureFlagsErrorMessage(response.errorName))
      setIsDataLoading(false)
      return
    }

    applyFlags(response.data)
    setIsDataLoading(false)
  }, [applyFlags])

  useEffect(() => {
    void loadFlags()
  }, [loadFlags])

  const handleSaveMemberSignup = async (): Promise<void> => {
    setSavingKey("member-signup")
    const response = await updateMemberSignupFlag(memberSignupEnabled)

    if (!response.ok || !response.data) {
      showError(resolveFeatureFlagsErrorMessage(response.errorName))
      setSavingKey(null)
      return
    }

    applyFlags(response.data)
    showSuccess("회원가입 허용 플래그를 저장했습니다.")
    setSavingKey(null)
  }

  const handleSaveStudyCreation = async (): Promise<void> => {
    setSavingKey("study-creation")
    const response = await updateStudyCreationFlag(studyCreationEnabled)

    if (!response.ok || !response.data) {
      showError(resolveFeatureFlagsErrorMessage(response.errorName))
      setSavingKey(null)
      return
    }

    applyFlags(response.data)
    showSuccess("스터디 개설 허용 플래그를 저장했습니다.")
    setSavingKey(null)
  }

  const handleSaveStudyEnrollWindow = async (): Promise<void> => {
    if (!enrollOpenAt || !enrollCloseAt) {
      showError("신청 시작/종료 시각을 모두 입력해주세요.")
      return
    }

    const openTime = new Date(enrollOpenAt).getTime()
    const closeTime = new Date(enrollCloseAt).getTime()

    if (!Number.isFinite(openTime) || !Number.isFinite(closeTime)) {
      showError("신청 기간 시각 형식이 올바르지 않습니다.")
      return
    }

    if (openTime >= closeTime) {
      showError("신청 시작 시각은 종료 시각보다 빨라야 합니다.")
      return
    }

    setSavingKey("study-enroll-window")
    const response = await updateStudyEnrollWindowFlag({
      openAt: toRequestLocalDateTime(enrollOpenAt),
      closeAt: toRequestLocalDateTime(enrollCloseAt),
    })

    if (!response.ok || !response.data) {
      showError(resolveFeatureFlagsErrorMessage(response.errorName))
      setSavingKey(null)
      return
    }

    applyFlags(response.data)
    showSuccess("스터디 신청 기간 플래그를 저장했습니다.")
    setSavingKey(null)
  }

  return (
    <div className="space-y-5">
      <AdminPageHeader
        title="피처 플래그 관리"
        description="회원가입/스터디 개설/스터디 신청 기간 운영 플래그를 관리합니다."
        actions={
          <Button variant="outline" onClick={() => void loadFlags()} disabled={isDataLoading}>
            {isDataLoading ? "새로고침 중..." : "새로고침"}
          </Button>
        }
      />

      {!flags && isDataLoading && (
        <Card>
          <CardContent className="space-y-3 p-6">
            <Skeleton className="h-6 w-1/3" />
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-2/3" />
          </CardContent>
        </Card>
      )}

      <AdminSectionCard
        title="회원가입 허용"
        description="회원가입 API 호출 허용 여부를 제어합니다."
        contentClassName="space-y-4"
      >
        <div className="flex flex-wrap items-center gap-2">
          <Select
            value={memberSignupEnabled ? "true" : "false"}
            onValueChange={(value) => setMemberSignupEnabled(value === "true")}
          >
            <SelectTrigger className="w-44">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="true">허용</SelectItem>
              <SelectItem value="false">차단</SelectItem>
            </SelectContent>
          </Select>
          <Button onClick={() => void handleSaveMemberSignup()} disabled={savingKey !== null}>
            {savingKey === "member-signup" ? "저장 중..." : "저장"}
          </Button>
        </div>

        <div className="flex flex-wrap gap-2 text-sm">
          <Badge variant="secondary">현재: {flags?.memberSignup.signupAllowed ? "허용" : "차단"}</Badge>
          <Badge variant="outline">유효성: {flags?.memberSignup.valid ? "정상" : "비정상"}</Badge>
          <Badge variant="outline">원시값: {flags?.memberSignup.rawValue ?? "-"}</Badge>
        </div>
      </AdminSectionCard>

      <AdminSectionCard
        title="스터디 개설 허용"
        description="스터디 개설 API 호출 허용 여부를 제어합니다."
        contentClassName="space-y-4"
      >
        <div className="flex flex-wrap items-center gap-2">
          <Select
            value={studyCreationEnabled ? "true" : "false"}
            onValueChange={(value) => setStudyCreationEnabled(value === "true")}
          >
            <SelectTrigger className="w-44">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="true">허용</SelectItem>
              <SelectItem value="false">차단</SelectItem>
            </SelectContent>
          </Select>
          <Button onClick={() => void handleSaveStudyCreation()} disabled={savingKey !== null}>
            {savingKey === "study-creation" ? "저장 중..." : "저장"}
          </Button>
        </div>

        <div className="flex flex-wrap gap-2 text-sm">
          <Badge variant="secondary">현재: {flags?.studyCreation.studyCreationAllowed ? "허용" : "차단"}</Badge>
          <Badge variant="outline">유효성: {flags?.studyCreation.valid ? "정상" : "비정상"}</Badge>
          <Badge variant="outline">원시값: {flags?.studyCreation.rawValue ?? "-"}</Badge>
        </div>
      </AdminSectionCard>

      <AdminSectionCard
        title="스터디 신청 기간"
        description="스터디 신청 가능 시작/종료 시각을 지정합니다."
        contentClassName="space-y-4"
      >
        <AdminFilterBar className="md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="open-time">신청 시작</Label>
              <Input
                id="open-time"
                type="datetime-local"
                value={enrollOpenAt}
                onChange={(event) => setEnrollOpenAt(event.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="close-time">신청 종료</Label>
              <Input
                id="close-time"
                type="datetime-local"
                value={enrollCloseAt}
                onChange={(event) => setEnrollCloseAt(event.target.value)}
              />
            </div>
        </AdminFilterBar>

        <Button onClick={() => void handleSaveStudyEnrollWindow()} disabled={savingKey !== null}>
          {savingKey === "study-enroll-window" ? "저장 중..." : "저장"}
        </Button>

        <div className="grid gap-2 text-sm">
          <div>현재 적용 시작 시각: {formatDateTime(flags?.studyEnrollWindow.openAt ?? null)}</div>
          <div>현재 적용 종료 시각: {formatDateTime(flags?.studyEnrollWindow.closeAt ?? null)}</div>
          <div>현재 신청 가능 여부: {flags?.studyEnrollWindow.enrollmentAllowedNow ? "가능" : "불가"}</div>
          <div>기간 유효성: {flags?.studyEnrollWindow.valid ? "정상" : "비정상(기본 허용 적용)"}</div>
        </div>
      </AdminSectionCard>
    </div>
  )
}

export default FeatureFlagsPage
