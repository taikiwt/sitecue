import { describe, it, expect } from "vitest";
import { extractTags } from "./tags";

describe("extractTags", () => {
  it("Markdownテキストからハッシュタグを正しく抽出・重複排除できること", () => {
    const content = `
#idea これは素晴らしいアイデアです。
途中のテキスト #info #alert #info

\`\`\`typescript
// コードブロック内の #コメント は無視されるべき
const a = "#ignored";
\`\`\`

インラインコード内の \`#inline\` も無視される。
      `;
    const tags = extractTags(content);
    expect(tags).toEqual(["idea", "info", "alert"]);
  });

  it("空文字やnullの場合は空配列を返すこと", () => {
    expect(extractTags("")).toEqual([]);
    expect(extractTags(null)).toEqual([]);
    expect(extractTags(undefined)).toEqual([]);
  });
});
