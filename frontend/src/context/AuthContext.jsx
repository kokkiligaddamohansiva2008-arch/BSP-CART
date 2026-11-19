import { createContext, useContext, useEffect, useState } from "react";
import { initAuth, logout } from "../services/authService";
import { clearSession, getSession } from "../utils/session";

const AuthContext = createContext({ ready: false, user: null, authenticated: false, logoutUser: () => {} });

export const AuthProvider = ({ children }) => {
  const [ready, setReady] = useState(false);
  const [user, setUser] = useState(null);

  useEffect(() => {
    let active = true;
    const sync = () => {
      if (!active) return;
      const s = getSession();
      setUser(s.token ? s : null);
    };
    window.addEventListener("bsp-session-changed", sync);

    // Handle rejected initialization: finally() alone leaves an unhandled
    // promise rejection in the browser console if the auth client fails.
    initAuth()
      .catch((error) => {
        console.error("[BSP CART] Unable to initialize authentication:", error);
        clearSession();
      })
      .finally(() => {
        if (!active) return;
        sync();
        setReady(true);
      });

    return () => {
      active = false;
      window.removeEventListener("bsp-session-changed", sync);
    };
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
