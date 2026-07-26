import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import localFont from "next/font/local";
import { Toaster } from "react-hot-toast";
import { ServiceWorkerRegister } from "@/components/pwa/ServiceWorkerRegister";
import { QueryProvider } from "@/providers/QueryProvider";
import "./globals.css";

const geistSans = Geist({
	variable: "--font-geist-sans",
	subsets: ["latin"],
});

const geistMono = Geist_Mono({
	variable: "--font-geist-mono",
	subsets: ["latin"],
});

const hackFont = localFont({
	src: [
		{
			path: "../fonts/hack-regular-subset.woff2",
			weight: "400",
			style: "normal",
		},
		{
			path: "../fonts/hack-bold-subset.woff2",
			weight: "700",
			style: "normal",
		},
	],
	variable: "--font-hack",
	display: "swap",
});

const defaultUrl = process.env.NEXT_PUBLIC_APP_URL
	? `https://${process.env.NEXT_PUBLIC_APP_URL}`
	: "http://127.0.0.1:3000";

export const metadata: Metadata = {
	metadataBase: new URL(defaultUrl),
	title: "sitecue",
	description: "Context-aware note taking app",
	manifest: "/manifest.webmanifest",
	appleWebApp: {
		capable: true,
		statusBarStyle: "default",
		title: "sitecue",
	},
};

export const viewport: Viewport = {
	themeColor: "#ffffff",
	width: "device-width",
	initialScale: 1,
	maximumScale: 1,
};

export default function RootLayout({
	children,
}: Readonly<{
	children: React.ReactNode;
}>) {
	return (
		<html lang="en">
			<body
				className={`${geistSans.variable} ${geistMono.variable} ${hackFont.variable} antialiased`}
			>
				<QueryProvider>
					<ServiceWorkerRegister />
					{children}
					<Toaster
						position="top-center"
						toastOptions={{ duration: 4000, style: { fontSize: "14px" } }}
					/>
				</QueryProvider>
			</body>
		</html>
	);
}
