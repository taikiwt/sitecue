"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { createClient } from "@/utils/supabase/client";
import type { Draft, DraftPlatform } from "../../../../../../types/app.ts";
import type { Tables } from "../../../../../../types/supabase.ts";

// モックデータの定義
const MOCK_NOTES: Partial<Tables<"sitecue_notes">>[] = [
	{
		id: "1",
		content: "TypeScript 5.0のリリースノートを確認する",
		note_type: "Info",
		created_at: "2026-04-06T10:00:00Z",
	},
	{
		id: "2",
		content: "APIの認証トークンが期限切れに近い可能性あり",
		note_type: "Alert",
		created_at: "2026-04-06T11:00:00Z",
	},
	{
		id: "3",
		content:
			"新しいエディタのUIについて：より没入感を高めるために背景を暗くするのはどうか",
		note_type: "Idea",
		created_at: "2026-04-06T12:00:00Z",
	},
	{
		id: "4",
		content: "Next.js 15のParallel Routesの調査",
		note_type: "Info",
		created_at: "2026-04-06T13:00:00Z",
	},
	{
		id: "5",
		content: "パフォーマンス改善：画像の遅延読み込みを徹底する",
		note_type: "Idea",
		created_at: "2026-04-06T14:00:00Z",
	},
];

interface DraftEditorProps {
	targetPlatform?: DraftPlatform;
	initialDraft?: Draft;
}

export default function DraftEditor({
	targetPlatform,
	initialDraft,
}: DraftEditorProps) {
	const router = useRouter();
	const supabase = createClient();
	const target = targetPlatform || initialDraft?.target_platform || "generic";

	const [status, setStatus] = useState<"idle" | "saving" | "error">("idle");
	const [content, setContent] = useState(initialDraft?.content || "");
	const [title, setTitle] = useState(initialDraft?.title || "");
	const [slug, setSlug] = useState(initialDraft?.metadata?.slug || "");

	const charCount = content.length;

	const handleSave = async () => {
		setStatus("saving");
		try {
			const metadata =
				target === "zenn" ? { slug } : initialDraft?.metadata || {};

			if (initialDraft?.id) {
				// UPDATE
				const { error } = await supabase
					.from("sitecue_drafts")
					.update({
						title,
						content,
						metadata,
						updated_at: new Date().toISOString(),
					})
					.eq("id", initialDraft.id);

				if (error) throw error;
			} else {
				// INSERT
				const { data, error } = await supabase
					.from("sitecue_drafts")
					.insert({
						title,
						content,
						target_platform: target,
						metadata,
					})
					.select()
					.single();

				if (error) throw error;
				if (data) {
					router.push(`/basecamp/draft/${data.id}`);
				}
			}
			setStatus("idle");
		} catch (error) {
			console.error("Failed to save draft:", error);
			alert("保存に失敗しました。詳細はコンソールを確認してください。");
			setStatus("error");
		}
	};

	return (
		<div className="flex h-screen overflow-hidden bg-neutral-50 text-neutral-950">
			{/* 左ペイン: メインエディタ */}
			<div className="flex flex-1 flex-col overflow-hidden border-r border-neutral-200 bg-white">
				{/* エディタヘッダー */}
				<header className="flex items-center justify-between border-b border-neutral-100 px-6 py-4">
					<div className="flex items-center gap-4">
						<Link
							href="/basecamp"
							className="text-sm text-neutral-400 transition-colors hover:text-neutral-900"
						>
							← Launchpad
						</Link>
						<div className="h-4 w-px bg-neutral-200" />
						<span className="text-sm font-medium text-neutral-900">
							{target === "x" &&
								(initialDraft ? "Edit Draft for X" : "New Draft for X")}
							{target === "zenn" &&
								(initialDraft ? "Edit Draft for Zenn" : "New Draft for Zenn")}
							{target === "generic" &&
								(initialDraft ? "Edit Note" : "New Note")}
						</span>
					</div>
					<button
						type="button"
						onClick={handleSave}
						disabled={status === "saving"}
						className={`rounded-full bg-neutral-900 px-6 py-1.5 text-sm font-medium text-white transition-opacity hover:opacity-90 ${
							status === "saving" ? "opacity-50 cursor-not-allowed" : ""
						}`}
					>
						{status === "saving" ? "保存中..." : "保存"}
					</button>
				</header>

				{/* 計器ボード / メタデータ入力 */}
				<div className="border-b border-neutral-100 bg-neutral-50/50 px-8 py-6">
					{target === "x" && (
						<div className="flex items-center justify-between">
							<span className="text-sm font-medium text-neutral-500 uppercase tracking-wider">
								Character Count
							</span>
							<span
								className={`text-2xl font-mono font-bold ${charCount > 140 ? "text-red-500" : "text-neutral-900"}`}
							>
								{charCount} / 140
							</span>
						</div>
					)}

					{target === "zenn" && (
						<div className="grid gap-4">
							<input
								type="text"
								placeholder="記事のタイトルを入力..."
								value={title}
								onChange={(e) => setTitle(e.target.value)}
								className="w-full bg-transparent text-2xl font-bold placeholder:text-neutral-300 focus:outline-none"
							/>
							<div className="flex items-center gap-2 text-sm text-neutral-400">
								<span>slug:</span>
								<input
									type="text"
									placeholder="example-article-slug"
									value={slug}
									onChange={(e) => setSlug(e.target.value)}
									className="flex-1 bg-transparent font-mono focus:outline-none"
								/>
							</div>
						</div>
					)}

					{target === "generic" && (
						<input
							type="text"
							placeholder="タイトル（任意）"
							value={title}
							onChange={(e) => setTitle(e.target.value)}
							className="w-full bg-transparent text-2xl font-bold placeholder:text-neutral-300 focus:outline-none"
						/>
					)}
				</div>

				{/* 本文入力エリア */}
				<main className="flex-1 overflow-y-auto px-8 py-10">
					<textarea
						placeholder="あなたの思考を書き留めてください..."
						value={content}
						onChange={(e) => setContent(e.target.value)}
						className="min-h-full w-full resize-none bg-transparent text-lg leading-relaxed placeholder:text-neutral-300 focus:outline-none"
					/>
				</main>
			</div>

			{/* 右ペイン: コンテキストバー (モバイル時は非表示) */}
			<aside className="hidden w-80 flex-col overflow-hidden bg-neutral-50 md:flex">
				<header className="border-b border-neutral-200 px-6 py-5">
					<h2 className="text-sm font-bold uppercase tracking-widest text-neutral-400">
						Materials
					</h2>
				</header>
				<div className="flex-1 overflow-y-auto p-4">
					<div className="grid gap-3">
						{MOCK_NOTES.map((note) => (
							<div
								key={note.id}
								className="group cursor-default rounded-xl border border-neutral-200 bg-white p-4 transition-all hover:border-neutral-400"
							>
								<div className="mb-2 flex items-center justify-between">
									<span
										className={`rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider ${
											note.note_type === "Info"
												? "bg-blue-50 text-blue-600"
												: note.note_type === "Alert"
													? "bg-red-50 text-red-600"
													: "bg-amber-50 text-amber-600"
										}`}
									>
										{note.note_type}
									</span>
									<span className="text-[10px] text-neutral-400">
										{note.created_at ? note.created_at.split("T")[0] : ""}
									</span>
								</div>
								<p className="line-clamp-3 text-sm leading-snug text-neutral-600 group-hover:text-neutral-900">
									{note.content}
								</p>
							</div>
						))}
					</div>
				</div>
				<div className="border-t border-neutral-200 p-6 text-center">
					<p className="text-xs text-neutral-400 italic">
						ノートをクリックして素材として引用（将来機能）
					</p>
				</div>
			</aside>
		</div>
	);
}
