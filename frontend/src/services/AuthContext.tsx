// src/contexts/AuthContext.tsx
import { createContext, useContext, useEffect, useState } from "react";
import { login as apiLogin, profile as apiProfile } from "./auth";

type User = { sub: string; username: string /* ajuste */ };

type AuthContextType = {
  user: User | null;
  token: string | null;
  signin: (u: string, p: string) => Promise<void>;
  signout: () => void;
  loading: boolean;
};

const AuthContext = createContext<AuthContextType>(null!);

export function AuthProvider({ children }) {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(
    localStorage.getItem("access_token")
  );
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!token) {
      setLoading(false);
      return;
    }
    apiProfile()
      .then((u) => setUser(u))
      .catch(() => {
        setToken(null);
        localStorage.removeItem("access_token");
      })
      .finally(() => setLoading(false));
  }, [token]);

  const signin = async (username: string, password: string) => {
    const { access_token } = await apiLogin(username, password);
    setToken(access_token);
    localStorage.setItem("access_token", access_token);
    const u = await apiProfile();
    setUser(u);
  };

  const signout = () => {
    setUser(null);
    setToken(null);
    localStorage.removeItem("access_token");
  };

  return (
    <AuthContext.Provider value={{ user, token, signin, signout, loading }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
