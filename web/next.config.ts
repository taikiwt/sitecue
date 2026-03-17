import path from "node:path";
import type { NextConfig } from "next";

const nextConfig = async (): Promise<NextConfig> => {
	return {
		/* config options here */
		outputFileTracingRoot: path.join(__dirname, "../"),
		turbopack: {
			root: path.join(__dirname, "../"),
		},
	};
};

export default nextConfig;
