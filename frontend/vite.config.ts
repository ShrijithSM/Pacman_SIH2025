// frontend/vite.config.ts
import path from "path"
import react from "@vitejs/plugin-react"
import { defineConfig } from "vite"

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  build: {
    rollupOptions: {
      input: {
        // The main app entry for your website (e.g., localhost:5173)
        main: path.resolve(__dirname, 'index.html'),
        // The embeddable widget entry
        embed: path.resolve(__dirname, 'src/embed.tsx'),
      },
      output: {
        // Ensure the embed script has a consistent name
        entryFileNames: (chunkInfo) => {
          if (chunkInfo.name === 'embed') {
            return 'embed.js';
          }
          return 'assets/[name]-[hash].js';
        },
        // Keep asset names consistent
        assetFileNames: 'assets/[name]-[hash][extname]',
        chunkFileNames: 'assets/[name]-[hash].js',
      },
    },
  },
})
