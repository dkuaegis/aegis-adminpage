import { useState } from "react"

import { demoteMembersForCurrentSemester } from "@/api/member/post-demote-members"
import { AdminPageHeader, AdminSectionCard } from "@/components/admin"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"
import { resolveAdminErrorMessage } from "@/lib/errors/admin-error"
import { showConfirm, showError, showSuccess } from "@/utils/alert"

const memberDemotionErrorOverrides: Record<string, string> = {
  INVALID_INPUT_VALUE: "요청 값이 올바르지 않습니다.",
}

const resolveMemberDemotionErrorMessage = (errorName?: string): string => {
  return resolveAdminErrorMessage(errorName, { overrides: memberDemotionErrorOverrides })
}

const MemberDemotionPage: React.FC = () => {
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [lastDemotedStudentIds, setLastDemotedStudentIds] = useState<string[]>([])

  const handleDemoteMembers = async (): Promise<void> => {
    const firstConfirmed = await showConfirm(
      "위험한 작업입니다. 현재 학기 회비 미납 회원을 게스트로 강등하시겠습니까?",
    )
    if (!firstConfirmed) {
      return
    }

    const secondConfirmed = await showConfirm(
      "최종 확인: 강등 작업은 즉시 반영되며 되돌리기 어렵습니다. 정말 실행하시겠습니까?",
    )
    if (!secondConfirmed) {
      return
    }

    setIsSubmitting(true)
    try {
      const response = await demoteMembersForCurrentSemester()

      if (!response.ok || !response.data) {
        showError(resolveMemberDemotionErrorMessage(response.errorName))
        return
      }

      const demotedIds = response.data.demotedMemberStudentIds ?? []
      setLastDemotedStudentIds(demotedIds)

      if (demotedIds.length === 0) {
        showSuccess("강등 대상 회원이 없습니다.")
      } else {
        showSuccess(`${demotedIds.length}명의 회원을 강등했습니다.`)
      }
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="space-y-5">
      <AdminPageHeader
        title="회원 강등"
        description="현재 학기 회비 미납 회원을 게스트(ROLE_GUEST)로 강등합니다. 관리자(ROLE_ADMIN)는 강등 대상에서 제외됩니다."
      />

      <AdminSectionCard
        title="강등 실행"
        description="실행 시 되돌리기 어렵습니다. 대상자 검토 후 진행하세요."
        contentClassName="space-y-4"
      >
        <div className="flex flex-wrap items-center justify-between gap-3 rounded-lg border bg-muted/30 p-4">
          <div className="text-sm text-muted-foreground">2단계 확인 후 즉시 반영됩니다.</div>
          <Button onClick={() => void handleDemoteMembers()} disabled={isSubmitting}>
            {isSubmitting ? "강등 실행 중..." : "회원 강등 실행"}
          </Button>
        </div>

        <Separator />

        <div className="space-y-3 text-sm">
          <div className="flex items-center gap-2">
            <span className="text-muted-foreground">마지막 강등 인원</span>
            <Badge variant="secondary">{lastDemotedStudentIds.length}명</Badge>
          </div>
          <div>
            <div className="mb-1 text-muted-foreground">마지막 강등 학번</div>
            <div className="rounded-lg border bg-background px-3 py-2 break-all">
              {lastDemotedStudentIds.length > 0 ? lastDemotedStudentIds.join(", ") : "-"}
            </div>
          </div>
        </div>
      </AdminSectionCard>
    </div>
  )
}

export default MemberDemotionPage
