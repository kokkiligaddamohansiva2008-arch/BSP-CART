import { createContext, useContext, useEffect, useState } from "react";
import { initAuth, logout } from "../services/authService";
import { getSession } from "../utils/session";

const AuthContext = createContext({ ready: false, user: null, authenticated: false, logoutUser: () => {} });

export const AuthProvider = ({ children }) => {
  const [ready, setReady] = useState(false);
  const [user, setUser] = useState(null);

  useEffect(() => {
    const sync = () => {
      const s = getSession();
      setUser(s.token ? s : null);
    };
    window.addEventListener("bsp-session-changed", sync);
    initAuth().finally(() => {
      sync();
      setReady(true);
    });
    return () => window.removeEventListener("bsp-session-changed", sync);
  }, []);

  const logoutUser = async () => {
    await logout();
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ ready, user, authenticated: !!user, logoutUser }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuthContext = () => useContext(AuthContext);

export default AuthContext;
