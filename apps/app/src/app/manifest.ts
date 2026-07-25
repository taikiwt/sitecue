import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
	return {
		name: "sitecue",
		short_name: "sitecue",
		description: "Context-aware note taking app",
		start_url: "/",
		display: "standalone",
		background_color: "#0a0a0a",
		theme_color: "#0a0a0a",
		icons: [
			{
				src: "/apple-icon.png",
				sizes: "180x180",
				type: "image/png",
				purpose: "any",
			},
		],
	};
}
