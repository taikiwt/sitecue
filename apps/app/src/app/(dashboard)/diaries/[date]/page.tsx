import { use } from "react";
import { DiaryStudioClient } from "./_components/DiaryStudioClient";

interface Props {
	params: Promise<{ date: string }>;
}

export default function DiaryStudioPage({ params }: Props) {
	const { date } = use(params);

	return <DiaryStudioClient date={date} />;
}
