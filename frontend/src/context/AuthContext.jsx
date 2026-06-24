import React, { createContext, useState, useEffect, useCallback } from "react";

export const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    try {
      const savedToken = localStorage.getItem("smartprep_token");
      const savedUser = localStorage.getItem("smartprep_user");
      if (savedToken && savedUser) {
        setToken(savedToken);
        setUser(JSON.parse(savedUser));
      }
    } catch {
      localStorage.removeItem("smartprep_token");
      localStorage.removeItem("smartprep_user");
    } finally {
      setLoading(false);
    }
  }, []);

  const login = useCallback((userData, authToken) => {
    setUser(userData);
    setToken(authToken);
    localStorage.setItem("smartprep_token", authToken);
    localStorage.setItem("smartprep_user", JSON.stringify(userData));
  }, []);

  const logout = useCallback(() => {
    setUser(null);
    setToken(null);
    localStorage.removeItem("smartprep_token");
    localStorage.removeItem("smartprep_user");
  }, []);

  const updateUser = useCallback((updatedUser) => {
    setUser(updatedUser);
    localStorage.setItem("smartprep_user", JSON.stringify(updatedUser));
  }, []);

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        loading,
        isAuthenticated: !!token,
        login,
        logout,
        updateUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};