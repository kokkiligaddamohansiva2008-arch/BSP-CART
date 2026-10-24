import { Link, NavLink, useNavigate } from "react-router-dom";
import {
  FaShoppingCart,
  FaUserCircle,
  FaSearch,
  FaBars,
  FaTimes,
  FaTimesCircle,
} from "react-icons/fa";
import { useState, useEffect } from "react";
import { useCartStore } from "../../utils/cartStore";
import { logout as signOut } from "../../services/authService";
import logo from "../../assets/logo.png";
import "../../styles/navbar.css";

function Navbar() {
  const [menuOpen, setMenuOpen] = useState(false);
  const [search, setSearch] = useState("");

  const navigate = useNavigate();
  const { items: cartCount } = useCartStore();
  const [, forceRender] = useState(0);

  useEffect(() => {
    const refresh = () => forceRender((n) => n + 1);
    window.addEventListener("bsp-session-changed", refresh);
    return () => window.removeEventListener("bsp-session-changed", refresh);
  }, []);

  const username = localStorage.getItem("name");
  const role = localStorage.getItem("role");

  const closeMenu = () => {
    setMenuOpen(false);
  };

  const handleSearch = (e) => {
    e.preventDefault();

    const query = search.trim();

    if (!query) {
      navigate("/products");
      closeMenu();
      return;
    }

    navigate(
      `/products?search=${encodeURIComponent(query)}`
    );

    closeMenu();
  };

  const clearSearch = () => {
    setSearch("");

    navigate("/products");

    closeMenu();
  };

  const logout = () => {
    signOut();

    closeMenu();

    navigate("/login");
  };

  const toggleMenu = () => {
    setMenuOpen((prev) => !prev);
  };

  return (
    <nav className="navbar-custom">

      <div className="container-fluid navbar-container">

        {/* ================================
            LOGO
        ================================= */}

        <Link
          className="logo"
          to="/"
          onClick={closeMenu}
        >
          <img
            src={logo}
            alt="BSP CART"
            className="logo-img"
          />
        </Link>


        {/* ================================
            DESKTOP SEARCH
        ================================= */}

        <form
          className="search-box"
          onSubmit={handleSearch}
        >
          <input id="nav-search-desktop" name="search-desktop"
            type="search"
            value={search}
            placeholder="Search products..."
            aria-label="Search products"
            onChange={(e) =>
              setSearch(e.target.value)
            }
          />

          {search && (
            <button
              type="button"
              className="search-clear"
              onClick={clearSearch}
              aria-label="Clear search"
              title="Clear search"
            >
              <FaTimesCircle />
            </button>
          )}

          <button
            type="submit"
            className="search-submit"
            aria-label="Search"
            title="Search"
          >
            <FaSearch />
          </button>
        </form>


        {/* ================================
            NAVIGATION
        ================================= */}

        <ul
          className={
            menuOpen
              ? "nav-links active"
              : "nav-links"
          }
        >

          {/* HOME */}

          <li>
            <NavLink
              to="/"
              onClick={closeMenu}
            >
              Home
            </NavLink>
          </li>


          {/* PRODUCTS */}

          <li>
            <NavLink
              to="/products"
              onClick={closeMenu}
            >
              Products
            </NavLink>
          </li>


          {/* ORDERS */}

          <li>
            <NavLink
              to="/orders"
              onClick={closeMenu}
            >
              Orders
            </NavLink>
          </li>


          {/* CART */}

          <li>
            <NavLink
              to="/cart"
              className="icon-link"
              onClick={closeMenu}
              title="Shopping Cart"
              aria-label="Shopping Cart"
            >
              <FaShoppingCart />
              {cartCount > 0 && (
                <span className="cart-badge" aria-label={`${cartCount} items in cart`}>
                  {cartCount > 99 ? "99+" : cartCount}
                </span>
              )}

              <span className="mobile-only-text">
                Cart
              </span>
            </NavLink>
          </li>


          {/* ================================
              NOT LOGGED IN
          ================================= */}

          {!username && (
            <>
              <li>
                <NavLink
                  to="/login"
                  onClick={closeMenu}
                >
                  Login
                </NavLink>
              </li>

              <li>
                <NavLink
                  to="/register"
                  onClick={closeMenu}
                >
                  Register
                </NavLink>
              </li>
            </>
          )}


          {/* ================================
              LOGGED IN
          ================================= */}

          {username && (
            <>

              {/* PROFILE */}

              <li>
                <NavLink
                  to="/profile"
                  className="profile-link"
                  onClick={closeMenu}
                  title="Profile"
                >
                  <FaUserCircle />

                  <span>
                    {username}
                  </span>
                </NavLink>
              </li>


              {/* ADMIN DASHBOARD */}

              {role === "ADMIN" && (
                <li>
                  <NavLink
                    to="/admin/dashboard"
                    onClick={closeMenu}
                  >
                    Dashboard
                  </NavLink>
                </li>
              )}


              {/* SELLER DASHBOARD */}

              {role === "SELLER" && (
                <li>
                  <NavLink
                    to="/seller/dashboard"
                    onClick={closeMenu}
                  >
                    Dashboard
                  </NavLink>
                </li>
              )}


              {/* BUYER DASHBOARD */}

              {role === "BUYER" && (
                <li>
                  <NavLink
                    to="/buyer/dashboard"
                    onClick={closeMenu}
                  >
                    Dashboard
                  </NavLink>
                </li>
              )}


              {/* LOGOUT */}

              <li>
                <button
                  type="button"
                  className="logout-btn"
                  onClick={logout}
                >
                  Logout
                </button>
              </li>

            </>
          )}

        </ul>


        {/* ================================
            MOBILE MENU BUTTON
        ================================= */}

        <button
          type="button"
          className="menu-icon"
          onClick={toggleMenu}
          aria-label={
            menuOpen
              ? "Close navigation menu"
              : "Open navigation menu"
          }
          aria-expanded={menuOpen}
        >
          {menuOpen ? (
            <FaTimes />
          ) : (
            <FaBars />
          )}
        </button>

      </div>


      {/* ================================
          MOBILE SEARCH
      ================================= */}

      <form
        className="mobile-search-box"
        onSubmit={handleSearch}
      >
        <input id="nav-search-mobile" name="search-mobile"
          type="search"
          value={search}
          placeholder="Search products..."
          aria-label="Search products"
          onChange={(e) =>
            setSearch(e.target.value)
          }
        />

        {search && (
          <button
            type="button"
            className="mobile-search-clear"
            onClick={clearSearch}
            aria-label="Clear search"
            title="Clear search"
          >
            <FaTimesCircle />
          </button>
        )}

        <button
          type="submit"
          className="mobile-search-submit"
          aria-label="Search"
          title="Search"
        >
          <FaSearch />
        </button>
      </form>

    </nav>
  );
}

export default Navbar;