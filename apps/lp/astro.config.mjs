import { defineConfig } from "astro/config";
import tailwindcss from "@tailwindcss/postcss";

export default defineConfig({
	vite: {
		css: {
			postcss: {
				plugins: [tailwindcss()],
			},
		},
	},
});
