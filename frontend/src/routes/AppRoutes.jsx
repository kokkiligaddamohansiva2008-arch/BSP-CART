import { Suspense, lazy } from "react";
import { Routes, Route } from "react-router-dom";

import ProtectedRoute from "../components/ProtectedRoute";

// Public pages
import Home from "../pages/Home";
import Login from "../pages/Login";
import Register from "../pages/Register";
const Products = lazy(() => import("../pages/Products"));
const ProductDetails = lazy(() => import("../pages/ProductDetails"));
const HelpCenter = lazy(() => import("../pages/HelpCenter"));
const PrivacyPolicy = lazy(() => import("../pages/PrivacyPolicy"));
const TermsConditions = lazy(() => import("../pages/TermsConditions"));
const ReturnPolicy = lazy(() => import("../pages/ReturnPolicy"));
const FAQs = lazy(() => import("../pages/FAQs"));
const NotFound = lazy(() => import("../pages/NotFound"));

// Buyer pages (require login)
const Cart = lazy(() => import("../pages/Cart"));
const Checkout = lazy(() => import("../pages/Checkout"));
const Orders = lazy(() => import("../pages/Orders"));
const Profile = lazy(() => import("../pages/Profile"));
const BuyerDashboard = lazy(() => import("../pages/BuyerDashboard"));

// Seller / Admin pages
const SellerDashboard = lazy(() => import("../pages/SellerDashboard"));
const AdminDashboard = lazy(() => import("../pages/AdminDashboard"));
const AdminUsers = lazy(() => import("../pages/AdminUsers"));
const AdminProducts = lazy(() => import("../pages/AdminProducts"));

function AppRoutes() {
  return (
    <Suspense fallback={<div style={{ padding: "80px 0", textAlign: "center", color: "#68728b" }}>Loading…</div>}>
    <Routes>
      {/* Public routes */}
      <Route path="/" element={<Home />} />
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />
      <Route path="/products" element={<Products />} />
      <Route path="/products/:id" element={<ProductDetails />} />
      <Route path="/help-center" element={<HelpCenter />} />
      <Route path="/privacy-policy" element={<PrivacyPolicy />} />
      <Route path="/terms" element={<TermsConditions />} />
      <Route path="/return-policy" element={<ReturnPolicy />} />
      <Route path="/faqs" element={<FAQs />} />

      {/* Buyer-protected routes (any logged-in user) */}
      <Route
        path="/cart"
        element={
          <ProtectedRoute>
            <Cart />
          </ProtectedRoute>
        }
      />
      <Route
        path="/checkout"
        element={
          <ProtectedRoute>
            <Checkout />
          </ProtectedRoute>
        }
      />
      <Route
        path="/orders"
        element={
          <ProtectedRoute>
            <Orders />
          </ProtectedRoute>
        }
      />
      <Route
        path="/profile"
        element={
          <ProtectedRoute>
            <Profile />
          </ProtectedRoute>
        }
      />
      <Route
        path="/buyer/dashboard"
        element={
          <ProtectedRoute buyerOnly>
            <BuyerDashboard />
          </ProtectedRoute>
        }
      />

      {/* Seller-protected routes */}
      <Route
        path="/seller/dashboard"
        element={
          <ProtectedRoute sellerOnly>
            <SellerDashboard />
          </ProtectedRoute>
        }
      />

      {/* Admin-protected routes */}
      <Route
        path="/admin/dashboard"
        element={
          <ProtectedRoute adminOnly>
            <AdminDashboard />
          </ProtectedRoute>
        }
      />

      <Route
        path="/admin/users"
        element={
          <ProtectedRoute adminOnly>
            <AdminUsers />
          </ProtectedRoute>
        }
      />
      <Route
        path="/admin/products"
        element={
          <ProtectedRoute adminOnly>
            <AdminProducts />
          </ProtectedRoute>
        }
      />

      {/* Fallback */}
      <Route path="*" element={<NotFound />} />
    </Routes>
    </Suspense>
  );
}

export default AppRoutes;