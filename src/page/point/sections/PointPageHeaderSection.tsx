import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"

export const PointPageHeaderSection: React.FC = () => {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-2xl">포인트 관리</CardTitle>
        <CardDescription>통합 원장 조회, 회원별 조회, 수동 지급(단건/일괄)을 처리합니다.</CardDescription>
      </CardHeader>
    </Card>
  )
}
