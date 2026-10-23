import Navbar from "./components/layout/Navbar";
import Footer from "./components/layout/Footer";
import AppRoutes from "./routes/AppRoutes";

function App() {
  return (
    <>
      <Navbar />

      <main style={{ minHeight: "80vh" }}>
        <AppRoutes />
      </main>

      <Footer />
    </>
  );
}

export default App;
