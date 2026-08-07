import { Suspense } from "react";
import { DashboardContainer } from "./_components/DashboardContainer";

export default function LaunchpadPage() {
	return (
		<Suspense fallback={null}>
			<DashboardContainer />
		</Suspense>
	);
}
