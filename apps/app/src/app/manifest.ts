import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
	return {
		name: "sitecue",
		short_name: "sitecue",
		description: "Context-aware note taking app",
		start_url: "/",
		display: "standalone",
		background_color: "#ffffff",
		theme_color: "#ffffff",
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
