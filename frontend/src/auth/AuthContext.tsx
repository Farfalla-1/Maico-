import { createContext, useContext, useState, useEffect, ReactNode } from "react";

type Role = "ADMIN" | "EMPLOYEE";

interface AuthContextType {
  token: string | null;
  role: Role | null;
  login: (accessToken: string, refreshToken: string) => void;
  logout: () => void;
  isAuthenticated: boolean;
  isAdmin: boolean;
}

function parseTokenPayload(token: string): { role: Role } | null {
  try {
    const payload = JSON.parse(atob(token.split(".")[1]));
    return { role: payload.role };
  } catch {
    return null;
  }
}

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [token, setToken] = useState<string | null>(() =>
    localStorage.getItem("token")
  );

  const payload = token ? parseTokenPayload(token) : null;
  const role = payload?.role ?? null;
  const isAuthenticated = token !== null;
  const isAdmin = role === "ADMIN";

  function login(accessToken: string, refreshToken: string) {
    localStorage.setItem("token", accessToken);
    localStorage.setItem("refreshToken", refreshToken);
    setToken(accessToken);
  }

  function logout() {
    localStorage.removeItem("token");
    localStorage.removeItem("refreshToken");
    setToken(null);
  }

  useEffect(() => {
    const handleStorage = () => {
      setToken(localStorage.getItem("token"));
    };
    window.addEventListener("storage", handleStorage);
    return () => window.removeEventListener("storage", handleStorage);
  }, []);

  return (
    <AuthContext.Provider value={{ token, role, login, logout, isAuthenticated, isAdmin }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextType {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
