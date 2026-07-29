import { Suspense } from "react";
import { requireUser } from "@/utils/supabase/server";
import { DashboardContainer } from "./_components/DashboardContainer";

export default async function LaunchpadPage() {
	await requireUser("/");

	return (
		<Suspense fallback={null}>
			<DashboardContainer />
		</Suspense>
	);
}
