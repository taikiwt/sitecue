"use client";

import { useSearchParams } from "next/navigation";
import { Suspense } from "react";
import type { DraftPlatform } from "../../../../../../types/app.ts";
import DraftEditor from "../../_components/DraftEditor";

function FocusModeEditor() {
	const searchParams = useSearchParams();
	const target = (searchParams.get("target") as DraftPlatform) || "generic";

	return <DraftEditor targetPlatform={target} />;
}

export default function FocusModePage() {
	return (
		<Suspense
			fallback={
				<div className="flex h-screen items-center justify-center bg-white text-neutral-400">
					Loading Studio...
				</div>
			}
		>
			<FocusModeEditor />
		</Suspense>
	);
}
