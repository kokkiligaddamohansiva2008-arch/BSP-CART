import { useMemo, useState } from "react";
import Swal from "sweetalert2";
import Sidebar from "../components/layout/Sidebar";
import DashboardHeader from "../components/dashboard/DashboardHeader";
import { getProducts, setProductStock, removeProduct, errMsg, LOW_STOCK } from "../services/adminService";
import "../styles/dashboard.css";
import "../styles/admin.css";

const inr = (n) => "₹" + Number(n || 0).toLocaleString("en-IN");
const toast = (icon, title) =>
  Swal.fire({ toast: true, position: "top-end", icon, title, showConfirmButton: false, timer: 2200 });

export default function AdminProducts() {
  const [items, setItems] = useState(getProducts);
  const [q, setQ] = useState("");
  const [cat, setCat] = useState("");
  const [lowOnly, setLowOnly] = useState(false);
  const [edits, setEdits] = useState({});

  const cats = useMemo(() => [...new Set(items.map((p) => p.category).filter(Boolean))], [items]);

  const rows = useMemo(() => {
    const s = q.trim().toLowerCase();
    return items.filter(
      (p) =>
        (!cat || p.category === cat) &&
        (!lowOnly || p.stock <= LOW_STOCK) &&
        (!s || p.name.toLowerCase().includes(s))
    );
  }, [items, q, cat, lowOnly]);

  const run = (fn, ok) => {
    try {
      fn();
      setItems(getProducts());
      toast("success", ok);
      return true;
    } catch (e) {
      toast("error", errMsg(e));
      return false;
    }
  };

  const saveStock = (p) => {
    const ok = run(() => setProductStock(p.id, parseInt(edits[p.id], 10)), "Stock updated");
    if (ok) setEdits(({ [p.id]: _, ...rest }) => rest);
  };

  const del = async (p) => {
    const { isConfirmed } = await Swal.fire({
      title: `Delete "${p.name}"?`, icon: "warning", showCancelButton: true,
      confirmButtonColor: "#EF4444", confirmButtonText: "Delete",
    });
    if (isConfirmed) run(() => removeProduct(p.id), "Product deleted");
  };

  return (
    <div className="dashboard-layout">
      <Sidebar />
      <div className="dashboard-main">
        <DashboardHeader title="Products" subtitle="Monitor inventory and remove seller listings" />
        <div className="adm-bar">
          <input placeholder="Search products" value={q} onChange={(e) => setQ(e.target.value)} />
          <select value={cat} onChange={(e) => setCat(e.target.value)}>
            <option value="">All categories</option>
            {cats.map((c) => <option key={c}>{c}</option>)}
          </select>
          <label style={{ alignSelf: "center" }}>
            <input type="checkbox" checked={lowOnly} onChange={(e) => setLowOnly(e.target.checked)} /> Low stock only
          </label>
          <span className="adm-count">{rows.length} of {items.length}</span>
        </div>
        <div className="adm-table-wrap">
          {!rows.length ? (
            <div className="adm-state">No products match.</div>
          ) : (
            <table className="adm-table">
              <thead><tr><th /><th>Name</th><th>Category</th><th>Price</th><th>Stock</th><th>Seller</th><th /></tr></thead>
              <tbody>
                {rows.map((p) => {
                  const dirty = edits[p.id] !== undefined && String(edits[p.id]) !== String(p.stock);
                  return (
                    <tr key={p.id}>
                      <td><img className="adm-thumb" src={p.image} alt="" loading="lazy" /></td>
                      <td>{p.name}</td>
                      <td style={{ textTransform: "capitalize" }}>{p.category || "—"}</td>
                      <td>{inr(p.price)}</td>
                      <td>
                        {p.editable ? (
                          <>
                            <input
                              className="adm-stock" type="number" min="0"
                              value={edits[p.id] ?? p.stock}
                              onChange={(e) => setEdits((s) => ({ ...s, [p.id]: e.target.value }))}
                            />{" "}
                            {dirty && <button className="adm-btn save" onClick={() => saveStock(p)}>Save</button>}
                          </>
                        ) : p.stock}{" "}
                        {!dirty && <span className={`adm-badge ${p.stock <= LOW_STOCK ? "low" : "ok"}`}>{p.stock <= LOW_STOCK ? "Low" : "OK"}</span>}
                      </td>
                      <td>{p.seller}</td>
                      <td>
                        {p.editable
                          ? <button className="adm-btn" onClick={() => del(p)}>Delete</button>
                          : <span style={{ color: "var(--text-secondary)", fontSize: 12 }}>Store item</span>}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
}
