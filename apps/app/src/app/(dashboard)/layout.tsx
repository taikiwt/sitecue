import { Suspense, type ReactNode } from "react";
import { AppShell } from "@/components/layout/AppShell";

export default function DashboardLayout({ children }: { children: ReactNode }) {
	return (
		<Suspense fallback={null}>
			<AppShell>{children}</AppShell>
		</Suspense>
	);
}
