import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    open: false
  },
  preview: {
    port: 4173
  },
  build: {
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (!id.includes("node_modules")) return;
          if (id.includes("recharts") || id.includes("/d3-")) return "charts";
          if (id.includes("sweetalert2")) return "alerts";
          if (id.includes("@supabase")) return "supabase";
          if (id.includes("react-icons")) return "icons";
          if (
            id.includes("react-dom") ||
            id.includes("react-router") ||
            id.includes("/node_modules/react/")
          ) return "framework";
        }
      }
    }
  }
});
