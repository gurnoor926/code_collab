import { useEffect, useState } from "react";
import { AuthContext } from "./authContext";
import authService from "../services/authService";

export function AuthProvider({ children }){
    const [user, setUser] =  useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(()=> {
        const initializeAuth = async () => {
            const token = localStorage.getItem("token");
            if(!token){
                setLoading(false);
                return;
            }

            try{
                const response = await authService.getCurrentUser();
                setUser(response);
            }catch{
                localStorage.removeItem("token");
                setUser(null);
            }finally{
                setLoading(false);
            }
        };

        initializeAuth();
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