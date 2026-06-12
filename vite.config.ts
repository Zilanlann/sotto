import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";

export default defineConfig({
  plugins: [react()],
  build: {
    rolldownOptions: {
      output: {
        codeSplitting: {
          groups: [
            { name: "react", test: /node_modules[\\/](react|react-dom|scheduler)[\\/]/ },
            {
              name: "heroui",
              test: /node_modules[\\/](@heroui|react-aria|react-stately|@react-aria|@react-stately|@react-types|@internationalized)[\\/]/,
            },
          ],
        },
      },
    },
  },
});
