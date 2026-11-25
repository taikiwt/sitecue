import { Suspense } from "react";
import { TrashContainer } from "./_components/TrashContainer";
import { TrashPageSkeleton } from "./_components/TrashSkeletons";

export default function TrashPage() {
	return (
		<Suspense fallback={<TrashPageSkeleton />}>
			<TrashContainer />
		</Suspense>
	);
}
