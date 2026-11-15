
import { useEffect, useState } from "react";
import { AuthContext } from "./authContextDef";
import authService from "../services/authService";
import { resetApiLogoutState } from "../services/api";

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // Initialize authentication.
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
          setUser(response?.user || response?.data || null);
        }
      } catch (error) {
        if (error.response?.status === 401) {
          localStorage.removeItem("token");
        }

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

  // Listen for centralized unauthorized events.
  useEffect(() => {
    const handleUnauthorized = () => {
      setUser(null);
    };

    window.addEventListener(
      "auth:logout",
      handleUnauthorized,
    );

    return () => {
      window.removeEventListener(
        "auth:logout",
        handleUnauthorized,
      );
    };
  }, []);

  // Login.
  const login = async (credentials) => {
    const response = await authService.login(credentials);

    localStorage.setItem("token", response.token);

    resetApiLogoutState();

    setUser(response.user);

    return response;
  };

  // Register.
  const register = async (userData) => {
    const response = await authService.register(userData);

    localStorage.setItem("token", response.token);

    resetApiLogoutState();

    setUser(response.user);

    return response;
  };

  // Logout.
  const logout = () => {
    localStorage.removeItem("token");

    resetApiLogoutState();

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
