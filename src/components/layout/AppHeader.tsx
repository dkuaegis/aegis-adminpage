import { LogOut, Menu } from "lucide-react"
import { useNavigate } from "react-router-dom"

import AegisLogo from "@/assets/logos/aegis.svg"
import { logout } from "@/api/auth/logout"
import { Button } from "@/components/ui/button"
import { showConfirm, showError, showSuccess } from "@/utils/alert"

interface AppHeaderProps {
  onOpenMobileSidebar: () => void
}

export default function AppHeader({ onOpenMobileSidebar }: AppHeaderProps) {
  const navigate = useNavigate()

  const handleLogout = async () => {
    const confirmed = await showConfirm("로그아웃 하시겠습니까?")
    if (!confirmed) {
      return
    }

    const success = await logout()
    if (!success) {
      showError("로그아웃 중 오류가 발생했습니다.")
      return
    }

    showSuccess("로그아웃 되었습니다.")
    window.location.href = "/login"
  }

  return (
    <header className="sticky top-0 z-40 border-b bg-background/90 backdrop-blur">
      <div className="mx-auto flex h-16 w-full max-w-[1680px] items-center justify-between px-4 sm:px-6 lg:px-8">
        <div className="flex items-center gap-2">
          <Button
            size="icon"
            variant="ghost"
            className="lg:hidden"
            onClick={onOpenMobileSidebar}
            aria-label="사이드바 열기"
          >
            <Menu className="size-5" />
          </Button>

          <button
            onClick={() => navigate("/")}
            className="flex items-center gap-3 rounded-lg px-2 py-1 hover:bg-accent"
          >
            <img className="size-8" src={AegisLogo} alt="Aegis Logo" />
            <span className="text-lg font-semibold">Aegis Admin</span>
          </button>
        </div>

        <Button variant="outline" onClick={handleLogout}>
          <LogOut className="size-4" />
          로그아웃
        </Button>
      </div>
    </header>
  )
}
