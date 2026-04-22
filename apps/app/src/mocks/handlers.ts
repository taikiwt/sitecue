// apps/app/src/mocks/handlers.ts
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
	http.post("*/ai/review", async () => {
		return HttpResponse.json({
			reviews: [
				{
					type: "info",
					content:
						"モック: 導入部分が長いため、結論を先に持ってくる構成も検討できます。",
				},
				{
					type: "idea",
					content:
						"モック: ここで具体的なユースケースを一つ挙げると説得力が増します。",
				},
			],
		});
	}),
	http.post("*/ai/hint", async () => {
		return HttpResponse.json({
			hint: "モック: この課題に対する具体的な解決策として、",
		});
	}),
];
