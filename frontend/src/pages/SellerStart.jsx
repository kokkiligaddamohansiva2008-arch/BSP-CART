import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuthContext } from "../context/AuthContext";
import { activateSellerAccount } from "../services/authService";
import Swal from "../utils/centeredSwal";

/**
 * An existing buyer does not need a second email/account to start selling.
 * The authenticated RPC upgrades their own verified account to SELLER.
 */
export default function SellerStart() {
  const { user } = useAuthContext();
  const navigate = useNavigate();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  const activate = async () => {
    if (busy) return;
    setBusy(true);
    setError("");
    try {
      await activateSellerAccount();
      await Swal.fire({
        icon: "success",
        title: "Seller account ready",
        text: "Your account is enabled for selling. You can now manage your shop.",
      });
      navigate("/seller/dashboard", { replace: true });
    } catch (cause) {
      setError(cause?.message || "Seller activation could not be completed.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <main className="container" style={{ padding: "48px 16px", minHeight: "65vh" }}>
      <div style={{
        maxWidth: 620, margin: "0 auto", padding: "clamp(20px, 4vw, 38px)",
        border: "1px solid #e4dfd5", borderRadius: 18, background: "#fff",
        boxShadow: "0 12px 28px rgba(32,42,68,.09)"
      }}>
        <h1 style={{ color: "#202a44", marginBottom: 16 }}>Become a BSP CART Seller</h1>
        <p>Use your existing BSP CART account to open a seller dashboard. Your email must be confirmed first.</p>
        <p>Once activated, you can upload product photos, set prices and stock, and manage your own listings.</p>
        {user?.role === "ADMIN" ? (
          <p role="alert" style={{ color: "#a32929" }}>
            Admin accounts cannot be converted into seller accounts. Sign in using a separate personal account.
          </p>
        ) : user?.role === "SELLER" ? (
          <Link className="btn btn-dark" to="/seller/dashboard">Open Seller Dashboard</Link>
        ) : (
          <button type="button" className="btn btn-dark" disabled={busy} onClick={activate}>
            {busy ? "Activating…" : "Activate Seller Account"}
          </button>
        )}
        {error && <p role="alert" style={{ color: "#b42318", marginTop: 16 }}>{error}</p>}
        <p style={{ marginTop: 22 }}>
          <Link to="/products">Return to products</Link>
        </p>
      </div>
    </main>
  );
}
