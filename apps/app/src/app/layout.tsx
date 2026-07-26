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

export const metadata: Metadata = {
	title: "sitecue",
	description: "Context-aware note taking app",
	appleWebApp: {
		capable: true,
		statusBarStyle: "default",
		title: "sitecue",
		startupImage: [
			{
				url: "/apple-splash.png",
				media:
					"(device-width: 375px) and (device-height: 812px) and (-webkit-device-pixel-ratio: 3), (device-width: 390px) and (device-height: 844px) and (-webkit-device-pixel-ratio: 3), (device-width: 428px) and (device-height: 926px) and (-webkit-device-pixel-ratio: 3), (device-width: 393px) and (device-height: 852px) and (-webkit-device-pixel-ratio: 3), (device-width: 430px) and (device-height: 932px) and (-webkit-device-pixel-ratio: 3)",
			},
		],
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
