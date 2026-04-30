import { render } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { NotesEditor } from "./NotesEditor";

// CodeMirrorがjsdom環境でクラッシュするのを防ぐ簡易モック
vi.mock("@uiw/react-codemirror", () => ({
	default: ({
		value: _value,
		onChange: _onChange,
	}: {
		value: string;
		onChange: () => void;
	}) => <div data-testid="mock-codemirror" />,
}));

describe("NotesEditor", () => {
	it("レンダリングの無限ループを起こさずマウントされること", () => {
		const { getByTestId } = render(
			<NotesEditor value="test" onChange={vi.fn()} />,
		);
		expect(getByTestId("mock-codemirror")).toBeInTheDocument();
	});
});
