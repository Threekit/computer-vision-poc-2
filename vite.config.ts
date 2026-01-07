import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { cloudflare } from "@cloudflare/vite-plugin";

export default defineConfig({
	plugins: [react(), cloudflare()],
	ssr: {
		// Mark Google Cloud packages as external for SSR
		// These are only used in the Cloudflare Worker, not the React frontend
		external: ["@google-cloud/vision", "@google/genai"],
		noExternal: [],
	},
	optimizeDeps: {
		// Exclude these packages from Vite's dependency optimization
		exclude: ["@google-cloud/vision", "@google/genai"],
	},
	resolve: {
		// This helps Vite understand these are Node.js-only packages
		conditions: ["worker", "browser"],
	},
});
