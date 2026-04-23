"use client";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { Suspense, useCallback, useEffect, useRef, useState } from "react";
import { SearchInputBase } from "@/components/ui/search-input-base";

function SearchInputInner() {
	const router = useRouter();
	const pathname = usePathname();
	const searchParams = useSearchParams();

	// Recover initial value from URL (combine q and tags for display)
	const initialQ = searchParams.get("q") || "";
	const initialTags = searchParams.get("tags")
		? (searchParams.get("tags") ?? "")
				.split(",")
				.map((t) => `#${t}`)
				.join(" ")
		: "";
	const [inputValue, setInputValue] = useState(
		`${initialTags} ${initialQ}`.trim(),
	);
	const inputRef = useRef<HTMLInputElement>(null);

	const timeoutRef = useRef<NodeJS.Timeout | null>(null);

	const updateUrl = useCallback(
		(value: string) => {
			const tokens = value.split(/\s+/).filter(Boolean);
			const tags = tokens
				.filter((t) => t.startsWith("#"))
				.map((t) => t.slice(1));
			const keywords = tokens.filter((t) => !t.startsWith("#")).join(" ");

			const params = new URLSearchParams();

			// リストの表示フィルター（domain等）はリセットするが、右ペインの選択状態は保護する
			if (searchParams.has("noteId")) {
				params.set("noteId", searchParams.get("noteId") as string);
			}
			if (searchParams.has("draftId")) {
				params.set("draftId", searchParams.get("draftId") as string);
			}

			if (keywords) params.set("q", keywords);
			if (tags.length > 0) params.set("tags", tags.join(","));

			const newQueryString = params.toString();

			// 重要：検索語が空、かつ現在のURLにも検索パラメータがない場合は何もしない
			// これにより ?domain=inbox 等が勝手に消されてループすることを防ぐ
			if (
				!newQueryString &&
				!searchParams.get("q") &&
				!searchParams.get("tags")
			) {
				return;
			}

			const newQ = params.get("q") || "";
			const newTags = params.get("tags") || "";
			const currentQ = searchParams.get("q") || "";
			const currentTags = searchParams.get("tags") || "";

			// 検索状態（キーワードとタグ）に変化がない場合は何もしない（過剰防衛の防止）
			// これにより、noteId等の別パラメータ追加時に勝手にURLが上書きされて詳細が閉じるのを防ぐ
			if (newQ === currentQ && newTags === currentTags) {
				return;
			}

			// 検索時は `/notes` へ強制（別画面からの検索対応）
			const targetPath = pathname === "/notes" ? pathname : "/notes";

			if (targetPath === pathname) {
				router.replace(`${targetPath}?${newQueryString}`, { scroll: false });
			} else {
				router.push(`${targetPath}?${newQueryString}`, { scroll: false });
			}
		},
		[pathname, router, searchParams],
	);

	// 外部からのURL変更（Inboxクリック等）に inputValue を追従させるだけの一方向同期
	useEffect(() => {
		// ユーザーが入力中の場合（IME変換中など）は、URLからの強制上書きをスキップする
		if (inputRef.current && document.activeElement === inputRef.current) {
			return;
		}

		const currentQ = searchParams.get("q") || "";
		const currentTags = searchParams.get("tags")
			? (searchParams.get("tags") ?? "")
					.split(",")
					.map((t) => `#${t}`)
					.join(" ")
			: "";
		const expected = `${currentTags} ${currentQ}`.trim();
		setInputValue(expected);
	}, [searchParams]);

	const handleClear = () => {
		setInputValue("");
		if (timeoutRef.current) clearTimeout(timeoutRef.current);
		updateUrl("");
	};

	return (
		<SearchInputBase
			ref={inputRef}
			value={inputValue}
			onChange={(val) => {
				setInputValue(val);
				if (timeoutRef.current) clearTimeout(timeoutRef.current);
				timeoutRef.current = setTimeout(() => {
					updateUrl(val);
				}, 300);
			}}
			onClear={handleClear}
			placeholder="Search keywords or #tags..."
		/>
	);
}

/**
 * OpenNext build crash avoidance wrapper.
 * useSearchParams must be used inside Suspense.
 */
export default function SearchInput() {
	return (
		<Suspense
			fallback={
				<div className="h-9 bg-base-bg/50 animate-pulse rounded-lg border border-transparent w-full" />
			}
		>
			<SearchInputInner />
		</Suspense>
	);
}
