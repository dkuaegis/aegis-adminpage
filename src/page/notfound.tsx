import { useNavigate } from "react-router-dom"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"

const NotFound: React.FC = () => {
  const navigate = useNavigate()

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>잘못된 접근이에요</CardTitle>
          <CardDescription>요청한 페이지를 찾지 못했습니다.</CardDescription>
        </CardHeader>
        <CardContent>
          <Button onClick={() => navigate("/")}>홈으로 이동</Button>
        </CardContent>
      </Card>
    </div>
  )
}

export default NotFound
