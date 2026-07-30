"use client";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { Suspense, useRef, useState } from "react";
import { SearchInputBase } from "@/components/ui/search-input-base";
import { useEditorStore } from "@/store/useEditorStore";

function SearchInputInner() {
	const router = useRouter();
	const pathname = usePathname();
	const searchParams = useSearchParams();

	// URLから期待される表示文字列を算出
	const currentQ = searchParams.get("q") || "";
	const currentTags = searchParams.get("tags")
		? (searchParams.get("tags") ?? "")
				.split(",")
				.map((t) => `#${t}`)
				.join(" ")
		: "";
	const expectedValue = `${currentTags} ${currentQ}`.trim();

	const [prevExpected, setPrevExpected] = useState(expectedValue);
	const [inputValue, setInputValue] = useState(expectedValue);
	const inputRef = useRef<HTMLInputElement>(null);

	// レンダー中に searchParams の変更を検知して同次同期（レンダーパスの追加を回避）
	if (prevExpected !== expectedValue) {
		setPrevExpected(expectedValue);
		// ユーザーが入力中でない場合のみ上書きする
		if (!inputRef.current || document.activeElement !== inputRef.current) {
			setInputValue(expectedValue);
		}
	}

	const isDirty = useEditorStore((state) => state.isDirty);

	const handleSubmit = (e: React.FormEvent) => {
		e.preventDefault();
		if (isDirty) {
			const confirm = window.confirm(
				"Unsaved changes will be lost. Do you want to continue?",
			);
			if (!confirm) return;
		}

		const params = new URLSearchParams(searchParams.toString());
		const tokens = inputValue.split(/\s+/).filter(Boolean);
		const tags = tokens.filter((t) => t.startsWith("#")).map((t) => t.slice(1));
		const keywords = tokens.filter((t) => !t.startsWith("#")).join(" ");

		if (keywords || tags.length > 0) {
			if (keywords) params.set("q", keywords);
			else params.delete("q");
			if (tags.length > 0) params.set("tags", tags.join(","));
			else params.delete("tags");

			// Clear selection params when doing a new global search
			params.delete("domain");
			params.delete("exact");
			params.delete("noteId");
			params.delete("draftId");
		} else {
			params.delete("q");
			params.delete("tags");
		}

		const targetPath = pathname === "/notes" ? pathname : "/notes";
		router.push(`${targetPath}?${params.toString()}`, { scroll: false });
	};

	const handleClear = () => {
		setInputValue("");
		const params = new URLSearchParams(searchParams.toString());
		params.delete("q");
		params.delete("tags");
		const targetPath = pathname === "/notes" ? pathname : "/notes";
		router.push(`${targetPath}?${params.toString()}`, { scroll: false });
	};

	return (
		<form onSubmit={handleSubmit} className="w-full">
			<SearchInputBase
				ref={inputRef}
				value={inputValue}
				onChange={(val) => setInputValue(val)}
				onClear={handleClear}
				placeholder="Search keywords or #tags..."
			/>
		</form>
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
