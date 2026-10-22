import { Link } from "react-router-dom";
import notFound from "../assets/notfound.png";

export default function NotFound() {
  return (
    <div style={{ textAlign: "center", padding: "60px 20px 80px" }}>
      <img src={notFound} alt="" style={{ width: 280, maxWidth: "70%", margin: "0 auto 20px" }} />
      <h1 style={{ fontSize: "1.8rem", fontWeight: 700, color: "#202a44" }}>Page not found</h1>
      <p style={{ color: "#68728b", marginBottom: 20 }}>
        The page you're looking for doesn't exist or has moved.
      </p>
      <Link to="/" className="cart-btn cart-btn-primary" style={{ display: "inline-block", padding: "12px 30px", background: "#202a44", color: "#fff", borderRadius: 10, fontWeight: 700 }}>
        Back to home
      </Link>
    </div>
  );
}
