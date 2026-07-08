import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import type { AuthStatus } from "../hooks/useAuth";
import type { Note } from "../hooks/useNotes";
import Header from "./Header";
import NoteItem from "./NoteItem";

describe("NoteItem Component", () => {
	const mockNote: Note = {
		id: "note-999",
		content: "Test note for layout sync #idea",
		note_type: "idea",
		scope: "exact",
		is_resolved: false,
		is_favorite: false,
		is_pinned: false,
		is_expanded: false,
		created_at: new Date().toISOString(),
		updated_at: new Date().toISOString(),
		user_id: "user-1",
		url_pattern: "example.com/page",
		sort_order: 0,
		tags: ["idea"],
	} as unknown as Note;

	it("Stickyヘッダー内に集約されたアクションボタン（Copy, Edit, Delete）やPin/Starボタンが正しく配置され機能すること", async () => {
		const mockOnDelete = vi.fn().mockResolvedValue(true);
		const mockOnToggleFavorite = vi.fn().mockResolvedValue(true);
		const mockOnTogglePinned = vi.fn().mockResolvedValue(true);

		render(
			<NoteItem
				note={mockNote}
				currentFullUrl="https://example.com/page"
				onUpdate={vi.fn()}
				onDelete={mockOnDelete}
				onToggleResolved={vi.fn()}
				onToggleFavorite={mockOnToggleFavorite}
				onTogglePinned={mockOnTogglePinned}
				onToggleExpansion={vi.fn()}
			/>,
		);

		// 2段構成ヘッダー内の各ボタンの存在表明
		const copyButton = screen.getByTitle("Copy note");
		const editButton = screen.getByTitle("Edit");
		const deleteButton = screen.getByTitle("Delete");
		const favoriteButton = screen.getByTitle("Add to favorites");
		const pinButton = screen.getByTitle("Pin note");

		expect(copyButton).toBeInTheDocument();
		expect(editButton).toBeInTheDocument();
		expect(deleteButton).toBeInTheDocument();
		expect(favoriteButton).toBeInTheDocument();
		expect(pinButton).toBeInTheDocument();

		// ユーザー操作の振る舞い検証
		fireEvent.click(deleteButton);
		expect(mockOnDelete).toHaveBeenCalledWith("note-999");

		fireEvent.click(favoriteButton);
		expect(mockOnToggleFavorite).toHaveBeenCalledWith(mockNote);

		fireEvent.click(pinButton);
		expect(mockOnTogglePinned).toHaveBeenCalledWith(mockNote);
	});
});

describe("Header - Settings Dot Promotion & Gear Removal", () => {
	it("右上の共通歯車設定ボタンが存在せず、タイトル左側のカラー丸ドットボタンをクリックすると設定エリアがトグルすること", () => {
		const authStatus: AuthStatus = {
			mode: "guest",
			session: null,
			userId: "guest-user",
		};

		render(
			<Header
				url="https://example.com/page"
				title="Example Page"
				domain="example.com"
				session={null}
				onLogout={vi.fn()}
				authStatus={authStatus}
			/>,
		);

		// 1. 歯車ボタン (title="Settings" などのボタン) が存在しないこと
		expect(screen.queryByTitle("Settings")).not.toBeInTheDocument();

		// 2. タイトル左側のカラー丸ドットボタンが存在すること
		const dotButton = screen.getByTitle("Toggle note settings");
		expect(dotButton).toBeInTheDocument();

		// 最初は設定エリア (Label 入力欄など) が非表示
		expect(screen.queryByLabelText(/Label/i)).not.toBeInTheDocument();

		// 3. ドットボタンクリックで設定エリアが表示されること
		fireEvent.click(dotButton);
		expect(screen.getByLabelText(/Label/i)).toBeInTheDocument();

		// もう一度クリックで非表示になること
		fireEvent.click(dotButton);
		expect(screen.queryByLabelText(/Label/i)).not.toBeInTheDocument();
	});
});
