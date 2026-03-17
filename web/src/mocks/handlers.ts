import { HttpResponse, http } from "msw";

export const handlers = [
	// WeaveUI からの POST /ai/weave リクエストを傍受してダミーレスポンスを返す
	http.post("*/ai/weave", () => {
		return HttpResponse.json({
			result:
				"# テスト用モック生成データ\nこれはMSWによって返されたモックのMarkdownです。",
		});
	}),
];
