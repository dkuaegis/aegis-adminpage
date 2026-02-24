import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

export const useAuthGuard = () => {
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();

  useEffect(() => {
    if (isAuthenticated === false) {
      navigate("/login");
    }
  }, [isAuthenticated, navigate]);

  const isLoading = isAuthenticated === null;
  const isAuthenticatedBool = isAuthenticated === true;

  return { isLoading, isAuthenticated: isAuthenticatedBool };
};
