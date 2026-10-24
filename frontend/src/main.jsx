
import React from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import App from "./App";
import { AuthProvider } from "./context/AuthContext";
import ProductsGate from "./components/ProductsGate";
import "./styles/variables.css";
import "./styles/theme.css";

import { testSupabaseConnection } from "./lib/testSupabase";
import { testProductsConnection } from "./lib/testProducts";

testSupabaseConnection();
testProductsConnection();

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <BrowserRouter
      future={{
        v7_startTransition: true,
        v7_relativeSplatPath: true,
      }}
    >
      <AuthProvider>
        <ProductsGate>
          <App />
        </ProductsGate>
      </AuthProvider>
    </BrowserRouter>
  </React.StrictMode>
);
