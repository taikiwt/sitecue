import { requireUser } from "@/utils/supabase/server";
import { DiaryStudioClient } from "./_components/DiaryStudioClient";

interface Props {
	params: Promise<{ date: string }>;
}

export default async function DiaryStudioPage({ params }: Props) {
	const { date } = await params;
	await requireUser(`/diaries/${date}`);

	return <DiaryStudioClient date={date} />;
}
