import { act, fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import MarkdownRenderer from "./MarkdownRenderer";

// InlineCopyButton のモック
vi.mock("@/components/ui/inline-copy-button", () => ({
	InlineCopyButton: ({ text }: { text: string }) => (
		<button
			type="button"
			data-testid="copy-button"
			title="Copy to clipboard"
			aria-label={`Copy ${text}`}
		>
			Copy
		</button>
	),
}));

describe("MarkdownRenderer", () => {
	it("renders a code block and toggles wrapping", async () => {
		const content = "```javascript\nconst a = 1;\n```";
		render(<MarkdownRenderer content={content} />);

		const wrapButton = screen.getByTitle("Wrap text");
		const pre = wrapButton.closest("div")?.nextElementSibling as HTMLPreElement;
		expect(pre).toBeInTheDocument();
		expect(pre).not.toHaveClass("whitespace-pre-wrap");

		await act(async () => {
			fireEvent.click(wrapButton);
		});

		expect(pre).toHaveClass("whitespace-pre-wrap");
		expect(pre).toHaveClass("break-all");
		expect(wrapButton).toHaveAttribute("title", "Disable wrap");

		await act(async () => {
			fireEvent.click(wrapButton);
		});

		expect(pre).not.toHaveClass("whitespace-pre-wrap");
		expect(wrapButton).toHaveAttribute("title", "Wrap text");
	});

	it("shows wrap and copy buttons on hover (group hover simulation)", async () => {
		const content = "```javascript\nconst a = 1;\n```";
		render(<MarkdownRenderer content={content} />);

		const wrapButton = screen.getByTitle("Wrap text");
		const _copyButton = screen.getByTestId("copy-button");

		// The buttons have opacity-100 pointer-fine:opacity-0 group-hover-safe:opacity-100
		// In JSDOM, classes are just strings, so we check if they have the correct classes
		const container = wrapButton.closest("div");
		expect(container).toHaveClass("opacity-100");
		expect(container).toHaveClass("group-hover-safe:opacity-100");
	});

	it("プロトコルが省略された外部リンクにhttps://が補完されること", () => {
		render(<MarkdownRenderer content="Check [Google](google.com)" />);
		const link = screen.getByRole("link", { name: /Google/i });
		expect(link).toHaveAttribute("href", "https://google.com");
	});

	it("連続する空行が視覚的な空行段落として保持され、コードブロック内の空行は変更されないこと", () => {
		const content =
			"Line 1\n\n\n\nLine 2\n\n```js\nconst a = 1;\n\n\nconst b = 2;\n```";
		const { container } = render(<MarkdownRenderer content={content} />);
		const paragraphs = container.querySelectorAll("p");
		expect(paragraphs.length).toBeGreaterThanOrEqual(4);
		expect(paragraphs[1].textContent).toBe("\u00A0");
		expect(paragraphs[2].textContent).toBe("\u00A0");

		const codeEl = container.querySelector("pre code");
		expect(codeEl?.textContent).toContain("const a = 1;\n\n\nconst b = 2;");
	});

	it("searchQueryが指定された場合にテキストノードのみを<mark>でハイライトし一致件数を通知すること", () => {
		const onMatchCountChange = vi.fn();
		const { container } = render(
			<MarkdownRenderer
				content={"Hello **world**, hello `code` world"}
				searchQuery="hello"
				activeMatchIndex={1}
				onMatchCountChange={onMatchCountChange}
			/>,
		);

		const marks = container.querySelectorAll('mark[data-search-match="true"]');
		expect(marks).toHaveLength(2);
		expect(marks[0]).not.toHaveAttribute("data-search-active", "true");
		expect(marks[1]).toHaveAttribute("data-search-active", "true");
		expect(onMatchCountChange).toHaveBeenCalledWith(2);
	});
});
