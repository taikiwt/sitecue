"use client";
import { Search, X } from "lucide-react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { Suspense, useCallback, useEffect, useRef, useState } from "react";

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

	const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

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

	// Cleanup on unmount
	useEffect(() => {
		return () => {
			if (timeoutRef.current) clearTimeout(timeoutRef.current);
		};
	}, []);

	// Passive synchronization: Update input value when URL changes (e.g. sidebar reset)
	useEffect(() => {
		const currentQ = searchParams.get("q") || "";
		const currentTags = searchParams.get("tags")
			? (searchParams.get("tags") ?? "")
					.split(",")
					.map((t) => `#${t}`)
					.join(" ")
			: "";
		const expected = `${currentTags} ${currentQ}`.trim();

		// Only update if different to avoid cursor jumping
		setInputValue((prev) => (prev === expected ? prev : expected));
	}, [searchParams]);

	const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
		const val = e.target.value;
		setInputValue(val);

		if (timeoutRef.current) clearTimeout(timeoutRef.current);
		timeoutRef.current = setTimeout(() => {
			updateUrl(val);
		}, 300);
	};

	const handleClear = () => {
		setInputValue("");
		if (timeoutRef.current) clearTimeout(timeoutRef.current);
		updateUrl("");
	};

	return (
		<div className="relative flex items-center w-full group">
			<Search
				className="absolute left-3 w-4 h-4 text-muted-foreground group-focus-within:text-action transition-colors"
				aria-hidden="true"
			/>
			<input
				type="text"
				value={inputValue}
				onChange={handleInputChange}
				placeholder="Search keywords or #tags..."
				className="w-full pl-9 pr-8 py-2 text-sm bg-base-bg border border-transparent focus:border-base-border focus:ring-2 focus:ring-base-border rounded-lg transition-all outline-none"
			/>
			{inputValue && (
				<button
					type="button"
					onClick={handleClear}
					className="absolute right-2 p-1 text-muted-foreground hover:text-action cursor-pointer transition-colors"
					aria-label="Clear search"
				>
					<X className="w-3.5 h-3.5" aria-hidden="true" />
				</button>
			)}
		</div>
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
