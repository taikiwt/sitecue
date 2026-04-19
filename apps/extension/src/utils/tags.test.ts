import { describe, expect, it } from "vitest";
import { extractTags } from "./tags";

describe("extractTags", () => {
	it("通常のハッシュタグを抽出できること", () => {
		expect(extractTags("これは #test と #アイデア のメモです")).toEqual([
			"test",
			"アイデア",
		]);
	});

	it("コードブロック内のハッシュタグを除外すること", () => {
		const content = `
通常の #valid タグ
\`\`\`css
#invalid-id { color: red; }
\`\`\`
インラインの \`#invalid_inline\` も除外。
ただし最後は #valid2
          `;
		expect(extractTags(content)).toEqual(["valid", "valid2"]);
	});

	it("重複したタグを一つにまとめること", () => {
		expect(extractTags("#test some text #test")).toEqual(["test"]);
	});

	it("空文字やタグなしの場合は空配列を返すこと", () => {
		expect(extractTags("タグのないただのテキスト")).toEqual([]);
		expect(extractTags("")).toEqual([]);
		expect(extractTags(null as unknown as string)).toEqual([]);
		expect(extractTags(undefined as unknown as string)).toEqual([]);
	});
});
