import { useState } from "react";
import { Link } from "react-router-dom";
import Swal from "../../utils/centeredSwal";
import { supabase } from "../../lib/supabase";
import {
  FaFacebookF,
  FaInstagram,
  FaLinkedinIn,
  FaGithub,
  FaEnvelope,
} from "react-icons/fa";
import "../../styles/footer.css";

function Footer() {
  const currentYear = new Date().getFullYear();
  const [email, setEmail] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const handleSubscribe = async (e) => {
    e.preventDefault();
    if (submitting) return;

    const value = email.trim().toLowerCase();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(value)) {
      await Swal.fire({ title: "Invalid email", text: "Please enter a valid email address.", icon: "warning" });
      return;
    }
    setSubmitting(true);
    try {
      // The public, rate-limited newsletter Edge Function handles inserts,
      // duplicate subscriptions and optional confirmation emails securely.
      // Direct browser writes are blocked by the table's RLS policies.
      const { data, error } = await supabase.functions.invoke("newsletter", {
        body: { email: value },
      });
      if (error) throw error;
      if (!data?.subscribed) throw new Error(data?.error || "Subscription could not be saved.");
      setEmail("");
      await Swal.fire({
        icon: "success",
        title: "Subscription saved!",
        text: data.emailSent
          ? "Check your inbox for your BSP CART confirmation."
          : "You're on the updates list. Email confirmations may not be configured yet.",
      });
    } catch (error) {
      console.error("Newsletter request failed", error);
      await Swal.fire({
        icon: "error",
        title: "Couldn't subscribe",
        text: "Please try again shortly. If it continues, contact customer support.",
      });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <footer
      className="bsp-footer"
      onClickCapture={(event) => {
        // Also scroll when the destination is the current route, in which
        // case React Router won't emit a location change for ScrollToTop.
        const link = event.target.closest?.("a[href]");
        if (link?.getAttribute("href")?.startsWith("/")) {
          requestAnimationFrame(() => window.scrollTo(0, 0));
        }
      }}
    >

      {/* =========================================
          MAIN FOOTER
      ========================================= */}

      <div className="footer-main">

        <div className="footer-container">

          {/* =====================================
              BRAND
          ===================================== */}

          <div className="footer-column footer-brand">

            <div className="footer-brand-icon">
              BC
            </div>

            <h2>BSP CART</h2>

            <p>
              Your everyday digital bazaar for
              products, deals and trusted sellers.
            </p>

            <div className="footer-socials">

              <a
                href="https://www.facebook.com"
                target="_blank"
                rel="noopener noreferrer"
                aria-label="Facebook"
              >
                <FaFacebookF />
              </a>

              <a
                href="https://www.instagram.com"
                target="_blank"
                rel="noopener noreferrer"
                aria-label="Instagram"
              >
                <FaInstagram />
              </a>

              <a
                href="https://www.linkedin.com"
                target="_blank"
                rel="noopener noreferrer"
                aria-label="LinkedIn"
              >
                <FaLinkedinIn />
              </a>

              <a
                href="https://github.com"
                target="_blank"
                rel="noopener noreferrer"
                aria-label="GitHub"
              >
                <FaGithub />
              </a>

            </div>

          </div>


          {/* =====================================
              SHOP
          ===================================== */}

          <div className="footer-column">

            <h3>Shop</h3>

            <Link to="/products">
              All Products
            </Link>

            <Link to="/products?deals=1">
              Deals
            </Link>

            <Link to="/cart">
              Cart
            </Link>

            <Link to="/orders">
              Orders
            </Link>

          </div>


          {/* =====================================
              QUICK LINKS
          ===================================== */}

          <div className="footer-column">

            <h3>Quick Links</h3>

            <Link to="/">
              Home
            </Link>

            <Link to="/products">
              Products
            </Link>

            <Link to="/cart">
              Cart
            </Link>

            <Link to="/orders">
              Orders
            </Link>

            <Link to="/login">
              Login
            </Link>

          </div>


          {/* =====================================
              ACCOUNT
          ===================================== */}

          <div className="footer-column">

            <h3>Account</h3>

            <Link to="/login">
              Login
            </Link>

            <Link to="/register">
              Register
            </Link>

            <Link to="/profile">
              My Profile
            </Link>

            <Link to="/buyer/dashboard">
              Buyer Dashboard
            </Link>

            <Link to="/seller/dashboard">
              Seller Dashboard
            </Link>

          </div>


          {/* =====================================
              CUSTOMER SERVICE
          ===================================== */}

          <div className="footer-column">

            <h3>Customer Service</h3>

            <Link to="/help-center">
              Help Center
            </Link>

            <Link to="/privacy-policy">
              Privacy Policy
            </Link>

            <Link to="/terms">
              Terms & Conditions
            </Link>

            <Link to="/return-policy">
              Return Policy
            </Link>

            <Link to="/faqs">
              FAQs
            </Link>

          </div>


          {/* =====================================
              BUSINESS
          ===================================== */}

          <div className="footer-column">

            <h3>Business</h3>

            <Link to="/register?role=SELLER">
              Become a Seller
            </Link>

            <Link to="/seller/dashboard">
              Seller Dashboard
            </Link>

            <Link to="/help-center">
              Customer Support
            </Link>

            <Link to="/return-policy">
              Shipping
            </Link>

          </div>

        </div>


        {/* =========================================
            NEWSLETTER
        ========================================= */}

        <div className="footer-newsletter">

          <div className="newsletter-content">

            <div>
              <h3>Stay Updated</h3>

              <p>
                Subscribe to receive the latest
                offers, deals and marketplace
                updates.
              </p>
            </div>

            <form
              className="newsletter-form"
              onSubmit={handleSubscribe}
              noValidate
            >

              <input id="footer-newsletter-email" name="email"
                type="email"
                placeholder="Enter your email"
                aria-label="Email address"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                disabled={submitting}
                autoComplete="email"
                required
              />

              <button type="submit" disabled={submitting}>
                <FaEnvelope />
                {submitting ? "Subscribing…" : "Subscribe"}
              </button>

            </form>

          </div>

        </div>

      </div>


      {/* =========================================
          BOTTOM FOOTER
      ========================================= */}

      <div className="footer-bottom">

        <div className="footer-bottom-container">

          <p>
            © {currentYear} BSP CART.
            All rights reserved.
          </p>

          <div className="footer-bottom-links">

            <Link to="/privacy-policy">
              Privacy
            </Link>

            <Link to="/terms">
              Terms
            </Link>

            <Link to="/return-policy">
              Returns
            </Link>

          </div>

          <p>
            Built for buyers and sellers.
          </p>

        </div>

      </div>

    </footer>
  );
}

export default Footer;