import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
	variable: "--font-geist-sans",
	subsets: ["latin"],
});

const geistMono = Geist_Mono({
	variable: "--font-geist-mono",
	subsets: ["latin"],
});

export const metadata: Metadata = {
	title: "sitecue - context-aware notes",
	description: "The simplest context-aware notepad for your browser.",
};

import { Suspense } from "react";
import { Toaster } from "react-hot-toast";
import { AppShell } from "@/components/layout/AppShell";
import { QueryProvider } from "@/providers/QueryProvider";
import GlobalNewNoteDialog from "./_components/GlobalNewNoteDialog";

export default function RootLayout({
	children,
}: Readonly<{
	children: React.ReactNode;
}>) {
	return (
		<html lang="en">
			<body
				className={`${geistSans.variable} ${geistMono.variable} antialiased`}
			>
				<QueryProvider>
					<Toaster
						position="top-center"
						toastOptions={{ duration: 4000, style: { fontSize: "14px" } }}
					/>
					<Suspense fallback={null}>
						<GlobalNewNoteDialog />
					</Suspense>
					<Suspense fallback={null}>
						<AppShell>{children}</AppShell>
					</Suspense>
				</QueryProvider>
			</body>
		</html>
	);
}
