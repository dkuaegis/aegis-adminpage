import type { MemberRecordSemesterOption } from "@/api/member-management/types"
import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"

interface MemberManagementHeaderSectionProps {
  semesterOptions: MemberRecordSemesterOption[]
  selectedYearSemester: string
  onChangeSemester: (yearSemester: string) => void
}

export const MemberManagementHeaderSection: React.FC<MemberManagementHeaderSectionProps> = ({
  semesterOptions,
  selectedYearSemester,
  onChangeSemester,
}) => {
  return (
    <Card>
      <CardHeader className="flex flex-row flex-wrap items-end justify-between gap-3">
        <div>
          <CardTitle className="text-2xl">회원 관리</CardTitle>
          <CardDescription>학기별 회원 기록 조회 및 상세 활동 기록을 확인합니다.</CardDescription>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-sm text-muted-foreground">학기</span>
          <Select value={selectedYearSemester} onValueChange={onChangeSemester}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="학기 선택" />
            </SelectTrigger>
            <SelectContent>
              {semesterOptions.map((option) => (
                <SelectItem key={option.yearSemester} value={option.yearSemester}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </CardHeader>
    </Card>
  )
}
