import { createContext, useContext, useEffect, useState } from "react";
import { getCurrentUser, isAuthenticated, logout } from "../services/authService";

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [authenticated, setAuthenticated] = useState(false);

  useEffect(() => {
    if (isAuthenticated()) {
      setUser(getCurrentUser());
      setAuthenticated(true);
    }
  }, []);

  const loginUser = (userData) => {
    setUser(userData);
    setAuthenticated(true);
  };

  const logoutUser = () => {
    logout();
    setUser(null);
    setAuthenticated(false);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        authenticated,
        loginUser,
        logoutUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuthContext = () => useContext(AuthContext);

export default AuthContext;