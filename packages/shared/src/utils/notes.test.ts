import { describe, expect, it } from "vitest";
import { resolveNotePayload } from "./notes";

describe("resolveNotePayload", () => {
	const baseInput = {
		content: "テストメモ #idea #sitecue",
		note_type: "idea" as const,
		scope: "exact" as const,
		currentUrl: "https://www.example.com/path/?q=1",
	};

	it("exactスコープの場合、URLを正しく正規化しタグを抽出できること", () => {
		const result = resolveNotePayload(baseInput);

		expect(result.content).toBe("テストメモ #idea #sitecue");
		expect(result.note_type).toBe("idea");
		expect(result.scope).toBe("exact");
		expect(result.url_pattern).toBe("example.com/path/?q=1");
		expect(result.tags).toEqual(["idea", "sitecue"]);
	});

	it("domainスコープの場合、ドメイン単位のパターンが算出されること", () => {
		const result = resolveNotePayload({
			...baseInput,
			scope: "domain",
		});

		expect(result.url_pattern).toBe("example.com");
	});

	it("inboxスコープの場合、currentUrlに関わらずパターンが強制されること", () => {
		const result = resolveNotePayload({
			...baseInput,
			scope: "inbox",
		});

		expect(result.url_pattern).toBe("inbox");
	});

	it("前後の余白がトリムされること", () => {
		const result = resolveNotePayload({
			...baseInput,
			content: "   余白ありメモ   ",
		});

		expect(result.content).toBe("余白ありメモ");
		expect(result.tags).toEqual([]);
	});
});
