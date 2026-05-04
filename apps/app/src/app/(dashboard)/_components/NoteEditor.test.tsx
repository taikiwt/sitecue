import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import NoteEditor from "./NoteEditor";

// Mock the limits
vi.mock("@/constants/limits", () => ({
	APP_LIMITS: {
		MAX_NOTE_LENGTH: 100,
		MAX_DRAFT_LENGTH: 1000,
		MAX_TEMPLATE_LENGTH: 50,
	},
}));

import type { UserState } from "@/store/useUserStore";

// Mock the store
vi.mock("@/store/useUserStore", () => ({
	useUserStore: (selector: (state: UserState) => unknown) =>
		selector({ openPaywall: vi.fn() } as Partial<UserState> as UserState),
}));

// Mock the editor to be a simple textarea for tests
vi.mock("@/components/editor/NotesEditor", () => ({
	NotesEditor: ({
		value,
		onChange,
		placeholder,
	}: {
		value: string;
		onChange: (v: string) => void;
		placeholder?: string;
	}) => (
		<textarea
			value={value}
			onChange={(e) => onChange(e.target.value)}
			placeholder={placeholder}
		/>
	),
}));

describe("NoteEditor Progressive Warning", () => {
	it("通常時は文字数カウンターが表示されないこと", async () => {
		render(<NoteEditor onSubmit={vi.fn()} />);
		const input = screen.getByPlaceholderText(/Write down your thoughts/i);
		await userEvent.type(input, "通常のメモ");
		expect(screen.queryByText(/100/)).not.toBeInTheDocument();
	});

	it("上限の90%に達するとカウンターが表示され、超過するとボタンがdisabledになること", async () => {
		render(<NoteEditor onSubmit={vi.fn()} />);
		const input = screen.getByPlaceholderText(/Write down your thoughts/i);

		// 90%以上の文字を入力 (90文字)
		const nearLimitText = "a".repeat(90);
		await userEvent.type(input, nearLimitText);

		expect(screen.getByText(/90 \/ 100/)).toBeInTheDocument();

		// 超過入力 (101文字)
		const overLimitText = "a".repeat(11);
		await userEvent.type(input, overLimitText);

		const submitButton = screen.getByRole("button", { name: /Save note/i });
		expect(submitButton).toBeDisabled();
		expect(screen.getByText(/101 \/ 100/)).toBeInTheDocument();
	});
});
