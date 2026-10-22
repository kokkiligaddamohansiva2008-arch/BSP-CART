import {
  FaTachometerAlt,
  FaUsers,
  FaBoxOpen,
  FaShoppingCart,
  FaMoneyBillWave,
  FaExclamationCircle,
  FaCog,
  FaChartBar,
  FaSignOutAlt,
  FaStore,
} from "react-icons/fa";

import { NavLink, useNavigate } from "react-router-dom";

import "../../styles/sidebar.css";

function Sidebar() {

  const role = localStorage.getItem("role");

  const navigate = useNavigate();

  const logout = () => {

    localStorage.clear();

    navigate("/login");

  };

  return (

    <aside className="sidebar">

      <div className="sidebar-logo">

        BSP <span>CART</span>

      </div>

      {/* ADMIN */}

      {role === "ADMIN" && (

        <>

          <NavLink to="/admin/dashboard">

            <FaTachometerAlt />

            Dashboard

          </NavLink>

          <NavLink to="/admin/users">

            <FaUsers />

            Users

          </NavLink>

          <NavLink to="/admin/products">

            <FaBoxOpen />

            Products

          </NavLink>

          </>

      )}

      {/* SELLER */}

      {role === "SELLER" && (

        <>

          <NavLink to="/seller/dashboard">

            <FaTachometerAlt />

            Dashboard

          </NavLink>

          <NavLink to="/seller/products">

            <FaBoxOpen />

            Products

          </NavLink>

          <NavLink to="/seller/orders">

            <FaShoppingCart />

            Orders

          </NavLink>

          <NavLink to="/seller/revenue">

            <FaMoneyBillWave />

            Revenue

          </NavLink>

        </>

      )}

      {/* BUYER */}

      {role === "BUYER" && (

        <>

          <NavLink to="/buyer/dashboard">

            <FaTachometerAlt />

            Dashboard

          </NavLink>

          <NavLink to="/products">

            <FaStore />

            Products

          </NavLink>

          <NavLink to="/cart">

            <FaShoppingCart />

            Cart

          </NavLink>

          <NavLink to="/orders">

            <FaBoxOpen />

            Orders

          </NavLink>

        </>

      )}

      <button
        className="sidebar-logout"
        onClick={logout}
      >

        <FaSignOutAlt />

        Logout

      </button>

    </aside>

  );

}

export default Sidebar;