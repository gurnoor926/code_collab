
import { useEffect, useState } from "react";
import { AuthContext } from "./authContextDef";
import authService from "../services/authService";

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;

    const initializeAuth = async () => {
      const token = localStorage.getItem("token");

      if (!token) {
        if (isMounted) {
          setLoading(false);
        }
        return;
      }

      try {
        const response = await authService.getCurrentUser();

        if (isMounted) {
          setUser(response.user);
        }
      } catch {
        localStorage.removeItem("token");

        if (isMounted) {
          setUser(null);
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    initializeAuth();

    return () => {
      isMounted = false;
    };
  }, []);

  const login = async (credentials) => {
    const response = await authService.login(credentials);

    localStorage.setItem("token", response.token);
    setUser(response.user);

    return response;
  };

  const register = async (userData) => {
    const response = await authService.register(userData);

    localStorage.setItem("token", response.token);
    setUser(response.user);

    return response;
  };

  const logout = () => {
    localStorage.removeItem("token");
    setUser(null);
  };

  const value = {
    user,
    loading,
    isAuthenticated: Boolean(user),
    login,
    register,
    logout,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

export default AuthProvider;

