import { useState } from "react";
import { Link } from "react-router-dom";
import Swal from "sweetalert2";
import { supabase, isSupabaseConfigured } from "../../lib/supabase";
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
      Swal.fire("Invalid email", "Please enter a valid email address.", "warning");
      return;
    }
    if (!isSupabaseConfigured || !supabase) {
      Swal.fire("Subscription unavailable", "The newsletter service is not configured.", "error");
      return;
    }
    setSubmitting(true);
    try {
      // Never write directly to the private subscriber table from the browser.
      const { data, error } = await supabase.functions.invoke("newsletter", {
        body: { email: value },
      });
      if (error || !data?.subscribed) {
        throw new Error(data?.error || error?.message || "Please try again.");
      }
      setEmail("");
      Swal.fire({
        icon: "success",
        title: "You are subscribed successfully!",
        text: data.emailSent
          ? "A confirmation email has been sent to your address."
          : "You're on the BSP CART list. Email confirmations are not currently enabled.",
        confirmButtonColor: "#202a44",
      });
    } catch (error) {
      Swal.fire("Couldn't subscribe", error.message || "Please try again.", "error");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <footer className="bsp-footer">

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

            <Link to="/products">
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
                required
              />

              <button type="submit" disabled={submitting} aria-busy={submitting}>
                <FaEnvelope />
                {submitting ? "Subscribing..." : "Subscribe"}
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