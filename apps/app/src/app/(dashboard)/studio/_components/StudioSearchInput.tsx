"use client";

import { SearchInputBase } from "@/components/ui/search-input-base";

interface StudioSearchInputProps {
	searchKeyword: string;
	onSearchKeywordChange: (value: string) => void;
	onSearch: () => void;
}

export default function StudioSearchInput({
	searchKeyword,
	onSearchKeywordChange,
	onSearch,
}: StudioSearchInputProps) {
	const handleClear = () => {
		onSearchKeywordChange("");
	};

	return (
		<SearchInputBase
			value={searchKeyword}
			onChange={onSearchKeywordChange}
			onClear={handleClear}
			onSubmit={onSearch}
			placeholder="Search global materials..."
		/>
	);
}
