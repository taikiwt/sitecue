import path from "node:path";
import type { NextConfig } from "next";

const nextConfig = async (): Promise<NextConfig> => {
	return {
		/* config options here */
		outputFileTracingRoot: path.join(__dirname, "../"),
		turbopack: {
			root: path.join(__dirname, "../"),
		},
		allowedDevOrigins: ["127.0.0.1", "localhost"],
	};
};

export default nextConfig;
