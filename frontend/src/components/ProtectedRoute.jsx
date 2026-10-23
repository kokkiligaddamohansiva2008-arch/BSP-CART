import { Navigate, useLocation } from "react-router-dom";
import { useAuthContext } from "../context/AuthContext";

function ProtectedRoute({ children, adminOnly = false, sellerOnly = false, buyerOnly = false }) {
  const location = useLocation();
  const { ready, user } = useAuthContext();

  // Wait until Supabase has restored the session (avoids a flash redirect to /login on refresh)
  if (!ready) return <div style={{ padding: "4rem", textAlign: "center" }}>Loading…</div>;

  if (!user) return <Navigate to="/login" state={{ from: location }} replace />;

  const userRole = user.role;
  if (adminOnly && userRole !== "ADMIN") return <Navigate to="/" replace />;
  if (sellerOnly && userRole !== "SELLER") return <Navigate to="/" replace />;
  if (buyerOnly && userRole !== "BUYER") return <Navigate to="/" replace />;

  return children;
}

export default ProtectedRoute;
