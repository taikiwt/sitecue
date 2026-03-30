// web/src/mocks/handlers.ts
import { HttpResponse, http } from "msw";

export const handlers = [
	// WeaveUI からの POST /ai/weave リクエストを傍受
	http.post("*/ai/weave", async ({ request }) => {
		const body = (await request.json()) as { context_id?: string };

		// context_id が送信されているかどうかの確認モックロジック
		if (body.context_id === "dummy-uuid-1234") {
			return HttpResponse.json({
				result:
					"# テスト用モック生成データ\nこれはMSWによって返されたモックのMarkdownです。(Context ID 認識済)",
			});
		}

		return HttpResponse.json({
			result: "# テスト用モック生成データ\n通常処理",
		});
	}),
];
