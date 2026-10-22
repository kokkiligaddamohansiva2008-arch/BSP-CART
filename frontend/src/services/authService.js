import api from "./api";

/*
|--------------------------------------------------------------------------
| Login
|--------------------------------------------------------------------------
*/

export const login = async (email, password) => {
  const response = await api.post("/auth/login", {
    email,
    password,
  });

  const data = response.data;

  if (data.token) {
    localStorage.setItem("token", data.token);
    localStorage.setItem("role", data.role);
    localStorage.setItem("userId", data.userId);
    localStorage.setItem("name", data.name);
  }

  return data;
};

/*
|--------------------------------------------------------------------------
| Register
|--------------------------------------------------------------------------
*/

export const register = async (userData) => {
  const response = await api.post("/auth/register", userData);

  return response.data;
};

/*
|--------------------------------------------------------------------------
| Logout
|--------------------------------------------------------------------------
*/

export const logout = () => {
  localStorage.removeItem("token");
  localStorage.removeItem("role");
  localStorage.removeItem("userId");
  localStorage.removeItem("name");
};

/*
|--------------------------------------------------------------------------
| Authentication
|--------------------------------------------------------------------------
*/

export const isAuthenticated = () => {
  return !!localStorage.getItem("token");
};

/*
|--------------------------------------------------------------------------
| Current User
|--------------------------------------------------------------------------
*/

export const getCurrentUser = () => {
  return {
    token: localStorage.getItem("token"),
    role: localStorage.getItem("role"),
    userId: localStorage.getItem("userId"),
    name: localStorage.getItem("name"),
  };
};

/*
|--------------------------------------------------------------------------
| Get Token
|--------------------------------------------------------------------------
*/

export const getToken = () => {
  return localStorage.getItem("token");
};