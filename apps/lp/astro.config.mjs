import { defineConfig } from "astro/config";
import tailwind from "@tailwindcss/vite";

// Astro v6 + Tailwind v4 完全静的（Zero JS）エッジ配信構成
export default defineConfig({
	output: "static",
	vite: {
		plugins: [tailwind()],
	},
});
