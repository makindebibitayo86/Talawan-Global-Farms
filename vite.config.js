import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";

export default defineConfig({
  plugins: [react(), tailwindcss()],
  build: {
    chunkSizeWarningLimit: 1000, // kB — safety ceiling after splitting below
    rollupOptions: {
      output: {
        manualChunks: {
          // React itself rarely changes, so it caches separately from your code
          "react-vendor": ["react", "react-dom"],
          // Supabase client is sizeable and only needed where data is fetched
          supabase: ["@supabase/supabase-js"],
          // Icon library — pulled in across many components, adds up fast
          icons: ["lucide-react"],
        },
      },
    },
  },
});
