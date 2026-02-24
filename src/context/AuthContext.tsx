import type React from "react";
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
} from "react";
import { showError, showSuccess } from "@/utils/alert";
import { Members } from "../api/auth/members";

interface AuthContextType {
  isAuthenticated: boolean | null; // null = loading, true = authenticated, false = not authenticated
  checkAuth: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null);

  const maybeShowWelcomeMessage = useCallback((name: string) => {
    const isLoginPage = window.location.pathname === "/login";
    if (isLoginPage) {
      return;
    }

    const hasShownWelcome = sessionStorage.getItem("hasShownWelcome");
    if (hasShownWelcome) {
      return;
    }

    showSuccess(`안녕하세요 ${name} 관리자님!`);
    sessionStorage.setItem("hasShownWelcome", "true");
  }, []);

  const checkAuth = useCallback(async () => {
    try {
      const response = await Members();
      if (!response.ok || !response.data) {
        setIsAuthenticated(false);
        return;
      }

      if (response.data.role !== "ADMIN") {
        setIsAuthenticated(false);
        showError("로그인 실패! 관리자만 접근 가능합니다.");
        return;
      }

      setIsAuthenticated(true);
      maybeShowWelcomeMessage(response.data.name);
    } catch (error) {
      console.error("인증 확인 실패:", error);
      setIsAuthenticated(false);
    }
  }, [maybeShowWelcomeMessage]);

  useEffect(() => {
    void checkAuth();
  }, [checkAuth]);

  return (
    <AuthContext.Provider value={{ isAuthenticated, checkAuth }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};
