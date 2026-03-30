import path from "node:path";
import type { NextConfig } from "next";

const nextConfig = async (): Promise<NextConfig> => {
	return {
		/* config options here */
		// outputFileTracingRoot: path.join(__dirname, "../../"), // モノレポルート
		// outputFileTracingRoot: path.join(__dirname), // apps/app 自身を指す

		turbopack: {
			// ❌ process.env... の条件分岐を消して、無条件でルートを指定します
			root: path.join(__dirname, "../../"),
		},
		allowedDevOrigins: ["127.0.0.1", "localhost"],
	};
};

export default nextConfig;
