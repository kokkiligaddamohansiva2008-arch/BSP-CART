import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import Swal from "sweetalert2";

const Address = () => {
  const navigate = useNavigate();

  const [product, setProduct] = useState(null);
  const [formData, setFormData] = useState({
    fullName: localStorage.getItem("name") || "",
    mobile: "",
    address: "",
    city: "",
    state: "",
    pincode: "",
  });

  useEffect(() => {
    // This page is also protected by AppRoutes, but keep a defensive check.
    if (!localStorage.getItem("token")) {
      navigate("/login", {
        state: { from: "/address" },
        replace: true,
      });
      return;
    }

    const savedProduct = localStorage.getItem("bsp_order_product");

    if (!savedProduct) {
      Swal.fire({
        icon: "warning",
        title: "No product selected",
        text: "Please select a product before continuing.",
      }).then(() => navigate("/products"));
      return;
    }

    try {
      setProduct(JSON.parse(savedProduct));
    } catch {
      localStorage.removeItem("bsp_order_product");
      navigate("/products", { replace: true });
    }
  }, [navigate]);

  const handleChange = (e) => {
    const { name, value } = e.target;

    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleContinue = (e) => {
    e.preventDefault();

    localStorage.setItem("bsp_delivery_address", JSON.stringify(formData));

    navigate("/checkout", {
      state: {
        product,
        address: formData,
      },
    });
  };

  if (!product) {
    return (
      <div className="container mt-5 mb-5">
        <div className="card shadow-sm">
          <div className="card-body text-center">
            <h3>Loading address...</h3>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="container mt-4 mb-5">
      <h2 className="mb-4">Delivery Address</h2>

      <div className="row g-4">
        <div className="col-lg-8">
          <div className="card shadow-sm">
            <div className="card-body">
              <h4 className="mb-3">Enter Delivery Address</h4>

              <form onSubmit={handleContinue}>
                <div className="row">
                  <div className="col-md-6 mb-3">
                    <label className="form-label">Full Name</label>
                    <input id="addr-fullName"
                      type="text"
                      className="form-control"
                      name="fullName"
                      value={formData.fullName}
                      onChange={handleChange}
                      required
                    />
                  </div>

                  <div className="col-md-6 mb-3">
                    <label className="form-label">Mobile Number</label>
                    <input id="addr-mobile"
                      type="tel"
                      className="form-control"
                      name="mobile"
                      value={formData.mobile}
                      onChange={handleChange}
                      pattern="[0-9]{10}"
                      maxLength="10"
                      placeholder="10-digit mobile number"
                      required
                    />
                  </div>

                  <div className="col-12 mb-3">
                    <label className="form-label">Address</label>
                    <textarea id="addr-address"
                      rows="3"
                      className="form-control"
                      name="address"
                      value={formData.address}
                      onChange={handleChange}
                      placeholder="House / Flat / Street / Area"
                      required
                    />
                  </div>

                  <div className="col-md-4 mb-3">
                    <label className="form-label">City</label>
                    <input id="addr-city"
                      type="text"
                      className="form-control"
                      name="city"
                      value={formData.city}
                      onChange={handleChange}
                      required
                    />
                  </div>

                  <div className="col-md-4 mb-3">
                    <label className="form-label">State</label>
                    <input id="addr-state"
                      type="text"
                      className="form-control"
                      name="state"
                      value={formData.state}
                      onChange={handleChange}
                      required
                    />
                  </div>

                  <div className="col-md-4 mb-3">
                    <label className="form-label">Pincode</label>
                    <input id="addr-pincode"
                      type="text"
                      className="form-control"
                      name="pincode"
                      value={formData.pincode}
                      onChange={handleChange}
                      pattern="[0-9]{6}"
                      maxLength="6"
                      required
                    />
                  </div>
                </div>

                <button type="submit" className="btn btn-primary w-100">
                  Continue to Checkout
                </button>
              </form>
            </div>
          </div>
        </div>

        <div className="col-lg-4">
          <div className="card shadow-sm">
            <div className="card-body">
              <h4>Selected Product</h4>
              <hr />

              <img
                src={
                  product.imageUrl ||
                  product.image ||
                  "data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='100' height='100'><rect width='100' height='100' fill='%23f1ebdd'/><text x='50' y='56' font-size='14' text-anchor='middle' fill='%2368728b' font-family='sans-serif'>No image</text></svg>"
                }
                alt={product.name}
                style={{
                  width: "100%",
                  maxHeight: "220px",
                  objectFit: "cover",
                  borderRadius: "8px",
                }}
              />

              <h5 className="mt-3">{product.name}</h5>
              <p className="text-muted">{product.description}</p>

              <div className="d-flex justify-content-between">
                <span>Price</span>
                <strong>₹ {product.price}</strong>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Address;
