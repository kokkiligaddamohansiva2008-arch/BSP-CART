import { useEffect, useRef, useState } from "react";
import { NavLink, useNavigate } from "react-router-dom";
import { FaEllipsisV, FaTachometerAlt, FaUsers, FaBoxOpen, FaSignOutAlt } from "react-icons/fa";
import { logout } from "../../services/authService";

/** Compact, accessible replacement for the overlapping admin sidebar. */
export default function AdminMenu() {
  const [open, setOpen] = useState(false);
  const container = useRef(null);
  const navigate = useNavigate();

  useEffect(() => {
    if (!open) return;
    const onPointer = (event) => {
      if (!container.current?.contains(event.target)) setOpen(false);
    };
    const onKey = (event) => {
      if (event.key === "Escape") setOpen(false);
    };
    document.addEventListener("pointerdown", onPointer);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("pointerdown", onPointer);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  const signOut = async () => {
    setOpen(false);
    await logout();
    navigate("/login");
  };

  return (
    <div className="adm-options" ref={container}>
      <button
        className="adm-options-trigger"
        type="button"
        aria-label="Admin options menu"
        aria-expanded={open}
        aria-haspopup="true"
        onClick={() => setOpen((value) => !value)}
      >
        <FaEllipsisV aria-hidden="true" />
        <span>Options</span>
      </button>
      {open && (
        <nav className="adm-options-menu" aria-label="Admin navigation">
          <NavLink to="/admin/dashboard" onClick={() => setOpen(false)}>
            <FaTachometerAlt aria-hidden="true" /> Dashboard
          </NavLink>
          <NavLink to="/admin/users" onClick={() => setOpen(false)}>
            <FaUsers aria-hidden="true" /> Users
          </NavLink>
          <NavLink to="/admin/products" onClick={() => setOpen(false)}>
            <FaBoxOpen aria-hidden="true" /> Products
          </NavLink>
          <button type="button" onClick={signOut}>
            <FaSignOutAlt aria-hidden="true" /> Logout
          </button>
        </nav>
      )}
    </div>
  );
}
