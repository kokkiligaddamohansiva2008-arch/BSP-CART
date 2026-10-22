import { useMemo, useState } from "react";
import Swal from "sweetalert2";
import Sidebar from "../components/layout/Sidebar";
import DashboardHeader from "../components/dashboard/DashboardHeader";
import { getUsers, setUserRole, deleteUser, errMsg, ROLE_LIST } from "../services/adminService";
import "../styles/dashboard.css";
import "../styles/admin.css";

const toast = (icon, title) =>
  Swal.fire({ toast: true, position: "top-end", icon, title, showConfirmButton: false, timer: 2200 });

export default function AdminUsers() {
  const [users, setUsers] = useState(getUsers);
  const [q, setQ] = useState("");
  const [role, setRole] = useState("");

  const rows = useMemo(() => {
    const s = q.trim().toLowerCase();
    return users.filter(
      (u) =>
        (!role || u.role === role) &&
        (!s || u.username.toLowerCase().includes(s) || u.name.toLowerCase().includes(s))
    );
  }, [users, q, role]);

  const run = (fn, ok) => {
    try {
      fn();
      setUsers(getUsers());
      toast("success", ok);
    } catch (e) {
      toast("error", errMsg(e));
    }
  };

  const del = async (u) => {
    const { isConfirmed } = await Swal.fire({
      title: `Delete ${u.name}?`,
      text: u.products ? `Their ${u.products} product(s) will be removed too.` : "This cannot be undone.",
      icon: "warning", showCancelButton: true, confirmButtonColor: "#EF4444", confirmButtonText: "Delete",
    });
    if (isConfirmed) run(() => deleteUser(u.username), "User deleted");
  };

  return (
    <div className="dashboard-layout">
      <Sidebar />
      <div className="dashboard-main">
        <DashboardHeader title="Users" subtitle="Search, change roles, remove accounts" />
        <div className="adm-bar">
          <input placeholder="Search username or name" value={q} onChange={(e) => setQ(e.target.value)} />
          <select value={role} onChange={(e) => setRole(e.target.value)}>
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
                  <tr key={u.username}>
                    <td>{u.username}</td>
                    <td>{u.name}</td>
                    <td>
                      <select
                        className="adm-select" value={u.role}
                        onChange={(e) => run(() => setUserRole(u.username, e.target.value), `${u.name} is now ${e.target.value}`)}
                      >
                        {ROLE_LIST.map((r) => <option key={r}>{r}</option>)}
                      </select>
                    </td>
                    <td>{u.products}</td>
                    <td><button className="adm-btn" onClick={() => del(u)}>Delete</button></td>
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
