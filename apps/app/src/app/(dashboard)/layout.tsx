import { type ReactNode, Suspense } from "react";
import { AppShell } from "@/components/layout/AppShell";

export default function DashboardLayout({ children }: { children: ReactNode }) {
	return (
		<AppShell>
			<Suspense fallback={null}>{children}</Suspense>
		</AppShell>
	);
}
