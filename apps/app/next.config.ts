import type { NextConfig } from "next";

const nextConfig = async (): Promise<NextConfig> => {
	return {
		/* config options here */
		allowedDevOrigins: ["127.0.0.1", "localhost"],
	};
};

export default nextConfig;
