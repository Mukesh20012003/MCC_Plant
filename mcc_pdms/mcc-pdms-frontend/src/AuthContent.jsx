// src/AuthContext.jsx
import { createContext, useContext, useState, useEffect } from "react";
import { getAccessToken, logout as clearTokens } from "./auth";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [accessToken, setAccessToken] = useState(getAccessToken());

  useEffect(() => {
    setAccessToken(getAccessToken());
  }, []);

  const loginWithToken = (token) => {
    setAccessToken(token);
  };

  const logout = () => {
    clearTokens();
    setAccessToken(null);
  };

  const value = {
    accessToken,
    isAuthenticated: !!accessToken,
    loginWithToken,
    logout,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  return useContext(AuthContext);
}
