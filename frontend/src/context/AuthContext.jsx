import React, { createContext, useState, useEffect, useContext } from "react";

const AuthContext = createContext(null);

export const API_BASE_URL = import.meta.env.VITE_API_URL || "http://127.0.0.1:8029";

export const AuthProvider = ({ children }) => {
  const [user, setUser]   = useState(null);
  const [token, setToken] = useState(localStorage.getItem("token") || null);
  const [loading, setLoading] = useState(true);

  // Verificar sesion existente al montar
  useEffect(() => {
    const fetchMe = async () => {
      if (!token) { setLoading(false); return; }
      try {
        const res = await fetch(`${API_BASE_URL}/api/auth/me`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (res.ok) {
          setUser(await res.json());
        } else {
          logout();
        }
      } catch {
        logout();
      } finally {
        setLoading(false);
      }
    };
    fetchMe();
  }, [token]);

  /**
   * loginWithPandora: recibe el JWT de Pandora SSO, lo envia al backend
   * de Biaticos que lo verifica y emite un JWT interno.
   */
  const loginWithPandora = async (pandoraToken) => {
    setLoading(true);
    try {
      const res = await fetch(`${API_BASE_URL}/api/auth/pandora`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ pandora_token: pandoraToken }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.detail || "Error al autenticar con Pandora SSO.");
      localStorage.setItem("token", data.access_token);
      setToken(data.access_token);
      setUser(data.user);
      return data.user;
    } catch (err) {
      console.error("loginWithPandora:", err);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const logout = () => {
    localStorage.removeItem("token");
    setToken(null);
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, token, loading, loginWithPandora, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth debe usarse dentro de AuthProvider");
  return ctx;
};