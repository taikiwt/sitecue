import { use } from "react";
import DraftEditor from "../../_components/DraftEditor";

interface DraftPageProps {
	params: Promise<{
		id: string;
	}>;
}

export default function DraftEditPage({ params }: DraftPageProps) {
	const { id } = use(params);

	return <DraftEditor draftId={id} />;
}
