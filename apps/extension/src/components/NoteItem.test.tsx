import { fireEvent, render, screen } from "@testing-library/react";
import { useState } from "react";
import { describe, expect, it, vi } from "vitest";
import type { AuthStatus } from "../hooks/useAuth";
import type { Note } from "../hooks/useNotes";
import Header from "./Header";
import NoteItem from "./NoteItem";

// 親コンポーネント(NoteList)の編集ステート管理を模倣するラッパー
const NoteItemTestWrapper = ({
	note,
	onUpdate = vi.fn().mockResolvedValue(true),
	onDelete = vi.fn().mockResolvedValue(true),
	onToggleResolved = vi.fn().mockResolvedValue(true),
	onToggleFavorite = vi.fn().mockResolvedValue(true),
	onTogglePinned = vi.fn().mockResolvedValue(true),
	onToggleExpansion = vi.fn().mockResolvedValue(true),
	currentFullUrl = "https://example.com/page",
	isFavoriteList = false,
	isPreview = false,
}: any) => {
	const [isEditing, setIsEditing] = useState(false);
	const [_isEditDirty, setIsEditDirty] = useState(false);

	return (
		<NoteItem
			note={note}
			currentFullUrl={currentFullUrl}
			isFavoriteList={isFavoriteList}
			isEditing={isEditing}
			onRequestEdit={(id) => setIsEditing(!!id)}
			onSetIsEditDirty={setIsEditDirty}
			onUpdate={onUpdate}
			onDelete={onDelete}
			onToggleResolved={onToggleResolved}
			onToggleFavorite={onToggleFavorite}
			onTogglePinned={onTogglePinned}
			onToggleExpansion={onToggleExpansion}
			isPreview={isPreview}
		/>
	);
};

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
			<NoteItemTestWrapper
				note={mockNote}
				onDelete={mockOnDelete}
				onToggleFavorite={mockOnToggleFavorite}
				onTogglePinned={mockOnTogglePinned}
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

	it("編集モード移行時に2段構成Stickyヘッダー（セレクトUI、カプセルUI）が正しく描画され、無変更ガードが機能すること", async () => {
		const mockOnUpdate = vi.fn().mockResolvedValue(true);

		render(<NoteItemTestWrapper note={mockNote} onUpdate={mockOnUpdate} />);

		// 編集モードを起動
		const editButton = screen.getByTitle("Edit");
		fireEvent.click(editButton);

		// 1. 決定テキストアクション、セレクトUI、コンテキストの存在表明
		const cancelButton = screen.getByRole("button", { name: /Cancel/i });
		const saveButton = screen.getByRole("button", { name: /Save/i });
		expect(cancelButton).toBeInTheDocument();
		expect(saveButton).toBeInTheDocument();

		const scopeSelect = screen.getByRole("combobox");
		expect(scopeSelect).toBeInTheDocument();
		expect(scopeSelect).toHaveValue("exact");

		// 初期状態は内容が「無変更」であるため、Saveボタンがdisabledになっていることを検証
		expect(saveButton).toBeDisabled();

		// 2. スコープの変更インタラクション検証
		fireEvent.change(scopeSelect, { target: { value: "domain" } });
		// 変更されたためガードが解除され、有効化されることを検証
		expect(saveButton).not.toBeDisabled();

		// 3. タイプカプセルのトグル検証（IdeaからAlertへ切り替え）
		const alertTypeButton = screen.getByTitle("Alert");
		fireEvent.click(alertTypeButton);

		// 4. テキスト変更による送信検証
		const textarea = screen.getByRole("textbox");
		fireEvent.change(textarea, {
			target: { value: "Updated content text #test" },
		});

		fireEvent.click(saveButton);
		expect(mockOnUpdate).toHaveBeenCalledWith(
			"note-999",
			"Updated content text #test",
			"alert",
			"domain",
		);
	});

	it("isPreviewがtrueの場合、GripVerticalハンドルやアクションボタン（Copy, Edit, Delete）が非表示になること", () => {
		render(<NoteItemTestWrapper note={mockNote} isPreview={true} />);

		expect(screen.queryByTitle("Drag to reorder")).not.toBeInTheDocument();
		expect(screen.queryByTitle("Copy note")).not.toBeInTheDocument();
		expect(screen.queryByTitle("Edit")).not.toBeInTheDocument();
		expect(screen.queryByTitle("Delete")).not.toBeInTheDocument();
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
