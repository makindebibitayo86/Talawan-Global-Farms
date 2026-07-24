import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";

export default defineConfig({
  plugins: [react(), tailwindcss()],
  build: {
    chunkSizeWarningLimit: 1000, // kB — safety ceiling after splitting below
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (!id.includes("node_modules")) return
          // React itself rarely changes, so it caches separately from your code
          if (id.includes("react") || id.includes("react-dom")) return "react-vendor"
          // Supabase client is sizeable and only needed where data is fetched
          if (id.includes("@supabase")) return "supabase"
          // Icon library — pulled in across many components, adds up fast
          if (id.includes("lucide-react")) return "icons"
        },
      },
    },
  },
});
