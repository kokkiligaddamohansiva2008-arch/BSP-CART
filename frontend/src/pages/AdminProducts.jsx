import { useEffect, useMemo, useState } from "react";
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
  const [items, setItems] = useState([]);
  const [q, setQ] = useState("");
  const [cat, setCat] = useState("");
  const [lowOnly, setLowOnly] = useState(false);
  const [photoIssuesOnly, setPhotoIssuesOnly] = useState(false);
  const [brokenPhotoIds, setBrokenPhotoIds] = useState([]);
  const [edits, setEdits] = useState({});

  const duplicateImageCount = useMemo(() => {
    const counts = new Map();
    items.filter((p) => !p.isSellerAdded && /^https?:\/\//i.test(String(p.image || "")))
      .forEach((p) => counts.set(p.image, (counts.get(p.image) || 0) + 1));
    return counts;
  }, [items]);
  const hasImageIssue = (p) =>
    brokenPhotoIds.includes(p.id) || !p.image || /product-fallback\.svg/i.test(p.image) ||
    /^data:image\/svg\+xml/i.test(p.image) ||
    (!p.isSellerAdded && (duplicateImageCount.get(p.image) || 0) > 1);
  const imageIssueCount = items.filter(hasImageIssue).length;

  const cats = useMemo(() => [...new Set(items.map((p) => p.category).filter(Boolean))], [items]);

  const rows = useMemo(() => {
    const s = q.trim().toLowerCase();
    return items.filter(
      (p) =>
        (!cat || p.category === cat) &&
        (!lowOnly || p.stock <= LOW_STOCK) &&
        (!photoIssuesOnly || hasImageIssue(p)) &&
        (!s || p.name.toLowerCase().includes(s))
    );
  }, [items, q, cat, lowOnly, photoIssuesOnly, brokenPhotoIds, duplicateImageCount]);

  useEffect(() => {
    getProducts().then(setItems).catch((e) => toast("error", errMsg(e)));
  }, []);

  const run = async (fn, ok) => {
    try {
      await fn();
      setItems(await getProducts());
      toast("success", ok);
      return true;
    } catch (e) {
      toast("error", errMsg(e));
      return false;
    }
  };

  const saveStock = async (p) => {
    const ok = await run(() => setProductStock(p.id, parseInt(edits[p.id], 10)), "Stock updated");
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
        <DashboardHeader title="Products" subtitle="Monitor inventory, image quality, and seller listings" />
        <p style={{ padding: "0 16px" }}><strong>{imageIssueCount}</strong> product images need review (missing, failed to load, or reused across unrelated imported listings). Visual product/name matches still require human review.</p>
        <div className="adm-bar">
          <input id="admprod-product-search" name="product-search" placeholder="Search products" value={q} onChange={(e) => setQ(e.target.value)} />
          <select id="admprod-category-filter" name="category-filter" value={cat} onChange={(e) => setCat(e.target.value)}>
            <option value="">All categories</option>
            {cats.map((c) => <option key={c}>{c}</option>)}
          </select>
          <label style={{ alignSelf: "center" }}>
            <input id="admprod-low-stock-only" name="low-stock-only" type="checkbox" checked={lowOnly} onChange={(e) => setLowOnly(e.target.checked)} /> Low stock only
          </label>
          <label style={{ alignSelf: "center" }}>
            <input id="admprod-image-issues-only" name="image-issues-only" type="checkbox" checked={photoIssuesOnly} onChange={(e) => setPhotoIssuesOnly(e.target.checked)} /> Photo issues only
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
                      <td><img className="adm-thumb" src={p.image || "/images/products/product-fallback.svg"} alt="" loading="lazy"
                        onError={(e) => {
                          e.currentTarget.onerror = null;
                          e.currentTarget.src = "/images/products/product-fallback.svg";
                          setBrokenPhotoIds((old) => old.includes(p.id) ? old : [...old, p.id]);
                        }} /></td>
                      <td>{p.name}{hasImageIssue(p) && <span className="adm-badge low" style={{ marginLeft: 6 }} title="Photograph requires review">Check image</span>}</td>
                      <td style={{ textTransform: "capitalize" }}>{p.category || "—"}</td>
                      <td>{inr(p.price)}</td>
                      <td>
                        {p.editable ? (
                          <>
                            <input id={`stock-${p.id}`} name={`stock-${p.id}`}
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
