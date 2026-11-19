import { getSession } from "../utils/session";
import { useEffect, useMemo, useState } from "react";
import Swal from "../utils/centeredSwal";
import AdminMenu from "../components/dashboard/AdminMenu";
import DashboardHeader from "../components/dashboard/DashboardHeader";
import { getUsers, setUserRole, deleteUser, errMsg, ROLE_LIST } from "../services/adminService";
import "../styles/dashboard.css";
import "../styles/admin.css";

const toast = (icon, title) =>
  Swal.fire({ toast: true, position: "top-end", icon, title, showConfirmButton: false, timer: 2200 });

export default function AdminUsers() {
  const [users, setUsers] = useState([]);
  const [q, setQ] = useState("");
  const [role, setRole] = useState("");
  const currentUserId = getSession().userId;

  const rows = useMemo(() => {
    const s = q.trim().toLowerCase();
    return users.filter(
      (u) =>
        (!role || u.role === role) &&
        (!s || String(u.username || "").toLowerCase().includes(s) || String(u.name || "").toLowerCase().includes(s))
    );
  }, [users, q, role]);

  const reload = () => getUsers().then(setUsers).catch((e) => toast("error", errMsg(e)));

  useEffect(() => {
    reload();
  }, []);

  const run = async (fn, ok) => {
    try {
      await fn();
      await reload();
      toast("success", ok);
    } catch (e) {
      toast("error", errMsg(e));
    }
  };

  const del = async (u) => {
    const { isConfirmed } = await Swal.fire({
      title: `Delete ${u.name}?`,
      text: "This permanently removes the account. Accounts with order history cannot be deleted.",
      icon: "warning", showCancelButton: true, confirmButtonColor: "#EF4444", confirmButtonText: "Delete",
    });
    if (isConfirmed) run(() => deleteUser(u.id), "User deleted");
  };

  return (
    <div className="dashboard-layout admin-page">
      <div className="dashboard-main">
        <div className="adm-page-heading">
          <DashboardHeader title="Users" subtitle="Search, change roles, remove accounts" />
          <AdminMenu />
        </div>
        <div className="adm-bar">
          <input id="admusers-user-search" name="user-search" placeholder="Search username or name" value={q} onChange={(e) => setQ(e.target.value)} />
          <select id="admusers-role-filter" name="role-filter" value={role} onChange={(e) => setRole(e.target.value)}>
            <option value="">All roles</option>
            {ROLE_LIST.map((r) => <option key={r}>{r}</option>)}
          </select>
          <span className="adm-count">{rows.length} of {users.length}</span>
        </div>
        <div className="adm-table-wrap">
          {!rows.length ? (
            <div className="adm-state">{users.length ? "No users match." : "No users have registered yet."}</div>
          ) : (
            <table className="adm-table">
              <thead><tr><th>Username</th><th>Name</th><th>Role</th><th>Products</th><th /></tr></thead>
              <tbody>
                {rows.map((u) => (
                  <tr key={u.id}>
                    <td>{u.username}</td>
                    <td>{u.name}</td>
                    <td>
                      <select id={`role-${u.id}`} name={`role-${u.id}`}
                        className="adm-select" value={u.role} disabled={u.id === currentUserId}
                        onChange={(e) => run(() => setUserRole(u.id, e.target.value), `${u.name} is now ${e.target.value}`)}
                      >
                        {ROLE_LIST.map((r) => <option key={r}>{r}</option>)}
                      </select>
                    </td>
                    <td>{u.products ?? "—"}</td>
                    <td><button className="adm-btn" type="button" disabled={u.id === currentUserId} onClick={() => del(u)}>Delete</button></td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
}
