import AegisLogo from "@/assets/logos/aegis.svg"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL

const Login: React.FC = () => {
  const handleLogin = () => {
    window.location.href = `${API_BASE_URL}/oauth2/authorization/google`
  }

  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-gradient-to-b from-zinc-100 to-zinc-200 px-4">
      <div className="pointer-events-none absolute -left-28 top-[-6rem] h-72 w-72 rounded-full bg-zinc-300/40 blur-3xl" />
      <div className="pointer-events-none absolute -right-20 bottom-[-5rem] h-72 w-72 rounded-full bg-zinc-400/20 blur-3xl" />

      <Card className="w-full max-w-lg shadow-xl">
        <CardHeader className="items-center text-center">
          <img className="mb-2 size-16" src={AegisLogo} alt="Aegis Logo" />
          <CardTitle className="text-3xl font-extrabold tracking-tight">Welcome Aegis Admin</CardTitle>
          <CardDescription>Aegis 관리자만 접근 가능합니다.</CardDescription>
        </CardHeader>

        <CardContent>
          <Button className="w-full" size="lg" onClick={handleLogin}>
            관리자 인증
          </Button>
        </CardContent>
      </Card>
    </div>
  )
}

export default Login
