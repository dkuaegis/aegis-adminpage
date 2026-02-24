import { useNavigate } from "react-router-dom"

import { NAV_ITEMS } from "@/components/layout/nav-items"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"

const Home: React.FC = () => {
  const navigate = useNavigate()

  return (
    <div className="space-y-5">
      <Card>
        <CardHeader>
          <CardTitle className="text-2xl">관리자 대시보드</CardTitle>
          <CardDescription>운영 기능은 그대로 유지하고, 화면은 shadcn 기반으로 재구성되었습니다.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap items-center gap-2">
            <Badge variant="secondary">React 19</Badge>
            <Badge variant="secondary">React Router 7</Badge>
            <Badge variant="secondary">shadcn/ui</Badge>
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {NAV_ITEMS.filter((item) => item.to !== "/").map((item) => {
          const Icon = item.icon
          return (
            <Card key={item.to} className="transition hover:-translate-y-0.5 hover:shadow-md">
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2 text-lg">
                  <Icon className="size-5" />
                  {item.label}
                </CardTitle>
                <CardDescription>{item.label} 기능으로 이동합니다.</CardDescription>
              </CardHeader>
              <CardContent>
                <Button variant="outline" onClick={() => navigate(item.to)}>
                  이동
                </Button>
              </CardContent>
            </Card>
          )
        })}
      </div>
    </div>
  )
}

export default Home
