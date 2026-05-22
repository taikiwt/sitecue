import tailwindcss from "@tailwindcss/postcss";
import { defineConfig } from "astro/config";

export default defineConfig({
	vite: {
		css: {
			postcss: {
				plugins: [tailwindcss()],
			},
		},
	},
});
