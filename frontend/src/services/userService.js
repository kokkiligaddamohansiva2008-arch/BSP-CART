import api from "./api";

/*
|--------------------------------------------------------------------------
| Get Logged-in User Profile
|--------------------------------------------------------------------------
*/

export const getProfile = async () => {
  const response = await api.get("/users/profile");
  return response.data;
};

/*
|--------------------------------------------------------------------------
| Update Profile
|--------------------------------------------------------------------------
*/

export const updateProfile = async (
  profileData
) => {
  const response = await api.put(
    "/users/profile",
    profileData
  );

  return response.data;
};

/*
|--------------------------------------------------------------------------
| Change Password
|--------------------------------------------------------------------------
*/

export const changePassword = async (
  passwordData
) => {
  const response = await api.put(
    "/users/change-password",
    passwordData
  );

  return response.data;
};

/*
|--------------------------------------------------------------------------
| Admin - Get All Users
|--------------------------------------------------------------------------
*/

export const getAllUsers = async () => {
  const response = await api.get("/admin/users");
  return response.data;
};

/*
|--------------------------------------------------------------------------
| Admin - Delete User
|--------------------------------------------------------------------------
*/

export const deleteUser = async (
  userId
) => {
  const response = await api.delete(
    `/admin/users/${userId}`
  );

  return response.data;
};

/*
|--------------------------------------------------------------------------
| Admin - Update User Role
|--------------------------------------------------------------------------
*/

export const updateUserRole = async (
  userId,
  role
) => {
  const response = await api.put(
    `/admin/users/${userId}/role`,
    { role }
  );

  return response.data;
};