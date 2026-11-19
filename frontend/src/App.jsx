import Navbar from "./components/layout/Navbar";
import Footer from "./components/layout/Footer";
import AppRoutes from "./routes/AppRoutes";
import ScrollToTop from "./components/ScrollToTop";

function App() {
  return (
    <>
      <ScrollToTop />
      <Navbar />

      <main style={{ minHeight: "80vh" }}>
        <AppRoutes />
      </main>

      <Footer />
    </>
  );
}

export default App;
