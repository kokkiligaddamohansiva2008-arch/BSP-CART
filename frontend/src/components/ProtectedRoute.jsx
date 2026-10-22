import { Navigate, useLocation } from "react-router-dom";

function ProtectedRoute({
  children,
  adminOnly = false,
  sellerOnly = false,
  buyerOnly = false,
}) {
  const location = useLocation();

  // Read login information from localStorage
  const isLoggedIn = !!localStorage.getItem("token");
  const userRole = localStorage.getItem("role");

  // User is not logged in
  if (!isLoggedIn) {
    return (
      <Navigate
        to="/login"
        state={{ from: location }}
        replace
      />
    );
  }

  // Admin route protection
  if (adminOnly && userRole !== "ADMIN") {
    return <Navigate to="/" replace />;
  }

  // Seller route protection
  if (sellerOnly && userRole !== "SELLER") {
    return <Navigate to="/" replace />;
  }

  // Buyer route protection
  if (buyerOnly && userRole !== "BUYER") {
    return <Navigate to="/" replace />;
  }

  return children;
}

export default ProtectedRoute;