import { supabase } from "../lib/supabase";
import { getSession } from "../utils/session";
import { getProfileById } from "./authService";

/*
|--------------------------------------------------------------------------
| Profiles (Supabase `profiles` table + Supabase Auth)
|--------------------------------------------------------------------------
*/

export const getProfile = async () => {
  const { data } = await supabase.auth.getUser();
  if (!data.user) throw new Error("Not signed in");
  const profile = await getProfileById(data.user.id);
  return { ...profile, email: data.user.email };
};

export const updateProfile = async ({ name }) => {
  const { userId } = getSession();
  const { data, error } = await supabase.from("profiles").update({ name }).eq("id", userId).select().single();
  if (error) throw new Error(error.message);
  localStorage.setItem("name", data.name);
  window.dispatchEvent(new Event("bsp-session-changed"));
  return data;
};

export const changePassword = async ({ newPassword }) => {
  const { error } = await supabase.auth.updateUser({ password: newPassword });
  if (error) throw new Error(error.message);
};

/* ---- admin ---- */

export const getAllUsers = async () => {
  const { data, error } = await supabase.from("profiles").select("*").order("created_at");
  if (error) throw new Error(error.message);
  return data;
};

export const deleteUser = async (userId) => {
  const { error } = await supabase.rpc("admin_delete_user", { p_user_id: userId });
  if (error) throw new Error(error.message);
};

export const updateUserRole = async (userId, role) => {
  const { error } = await supabase.from("profiles").update({ role }).eq("id", userId);
  if (error) throw new Error(error.message);
};
