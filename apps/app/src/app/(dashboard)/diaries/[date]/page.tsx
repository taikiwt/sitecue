import { requireUser } from "@/utils/supabase/server";
import { fetchDiaryByDate } from "@sitecue/shared";
import { DiaryStudioClient } from "./_components/DiaryStudioClient";

interface Props {
	params: Promise<{ date: string }>;
}

export default async function DiaryStudioPage({ params }: Props) {
	const { date } = await params;
	const { supabase, user } = await requireUser(`/diaries/${date}`);

	// 規約遵守: 生のクエリをパージし、DAL関数を徹底利用
	const diary = await fetchDiaryByDate(supabase, user.id, date);

	return <DiaryStudioClient date={date} initialDiary={diary} />;
}
