import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { FaUsers, FaBoxOpen, FaExclamationTriangle, FaRupeeSign } from "react-icons/fa";
import Sidebar from "../components/layout/Sidebar";
import DashboardHeader from "../components/dashboard/DashboardHeader";
import StatsGrid from "../components/dashboard/StatsGrid";
import DashboardCard from "../components/dashboard/DashboardCard";
import { getUsers, getProducts, getOrders, LOW_STOCK } from "../services/adminService";
import "../styles/dashboard.css";
import "../styles/admin.css";

const inr = (n) => "₹" + Math.round(n).toLocaleString("en-IN");
const countBy = (arr, key) =>
  arr.reduce((m, x) => {
    const k = x[key] || "other";
    m[k] = (m[k] || 0) + 1;
    return m;
  }, {});

function Bars({ data }) {
  const max = Math.max(1, ...Object.values(data));
  const entries = Object.entries(data);
  if (!entries.length) return <div className="adm-empty">No data yet.</div>;
  return (
    <div className="adm-bars">
      {entries.map(([k, v]) => (
        <div key={k}>
          <span>{k.toLowerCase()}</span>
          <i style={{ width: `${(v / max) * 60}%` }} />
          <b>{v}</b>
        </div>
      ))}
    </div>
  );
}

export default function AdminDashboard() {
  const [s, setS] = useState({
    users: [], products: [], orders: 0, low: [], value: 0, roles: {}, cats: {}, newest: [],
  });
  const [error, setError] = useState("");

  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        const [users, products, orders] = await Promise.all([getUsers(), getProducts(), getOrders()]);
        if (!alive) return;
        setS({
          users,
          products,
          orders: orders.length,
          low: products.filter((p) => p.stock <= LOW_STOCK),
          value: products.reduce((t, p) => t + p.price * p.stock, 0),
          roles: countBy(users, "role"),
          cats: countBy(products, "category"),
          newest: users.slice(-5).reverse(),
        });
      } catch (e) {
        if (alive) setError(e.message || "Could not load dashboard data");
      }
    })();
    return () => { alive = false; };
  }, []);

  return (
    <div className="dashboard-layout">
      <Sidebar />
      <div className="dashboard-main">
        <DashboardHeader title="Admin Dashboard" subtitle="Live overview of your marketplace" />
        {error && <div className="adm-empty" role="alert">{error}</div>}

        <StatsGrid>
          <DashboardCard title="Registered Users" value={s.users.length} icon={<FaUsers />} color="#202a44" />
          <DashboardCard title="Products" value={s.products.length} icon={<FaBoxOpen />} color="#10B981" />
          <DashboardCard title="Low Stock" value={s.low.length} icon={<FaExclamationTriangle />} color="#b5533c" />
          <DashboardCard title="Inventory Value" value={inr(s.value)} icon={<FaRupeeSign />} color="#EF4444" />
        </StatsGrid>

        <div className="adm-grid">
          <div className="adm-card"><h3>Products by category</h3><Bars data={s.cats} /></div>
          <div className="adm-card"><h3>Users by role</h3><Bars data={s.roles} /></div>
        </div>

        <div className="adm-grid">
          <div className="adm-card">
            <h3>
              Needs restocking
              <Link to="/admin/products" style={{ fontSize: 14, float: "right" }}>Manage →</Link>
            </h3>
            {s.low.length ? (
              <ul className="adm-list">
                {s.low.slice(0, 6).map((p) => (
                  <li key={p.id}><span>{p.name}</span><b>{p.stock} left</b></li>
                ))}
              </ul>
            ) : <div className="adm-empty">All products are well stocked.</div>}
          </div>

          <div className="adm-card">
            <h3>
              Newest users
              <Link to="/admin/users" style={{ fontSize: 14, float: "right" }}>All →</Link>
            </h3>
            {s.newest.length ? (
              <ul className="adm-list">
                {s.newest.map((u) => (
                  <li key={u.id}><span>{u.name}</span><span className={`adm-badge ${u.role}`}>{u.role}</span></li>
                ))}
              </ul>
            ) : <div className="adm-empty">No users have registered yet.</div>}
            <p style={{ marginTop: 14, color: "var(--text-secondary)", fontSize: 13 }}>
              Orders recorded: {s.orders}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
