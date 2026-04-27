import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import localFont from "next/font/local";
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
	title: "sitecue - context-aware notes",
	description: "The simplest context-aware notepad for your browser.",
};

import { Toaster } from "react-hot-toast";
import { QueryProvider } from "@/providers/QueryProvider";

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
