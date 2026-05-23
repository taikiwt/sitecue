"use client";

import { useState } from "react";

interface DomainFaviconProps {
	domain: string;
}

export function DomainFavicon({ domain }: DomainFaviconProps) {
	const [hasError, setHasError] = useState(false);
	const faviconUrl = `https://www.google.com/s2/favicons?domain=${domain}&sz=64`;

	if (hasError) {
		return null;
	}

	return (
		// biome-ignore lint/performance/noImgElement: Dynamic external favicon URLs cannot be optimized using Next.js Image component
		<img
			src={faviconUrl}
			alt=""
			className="w-5 h-5 object-contain"
			onError={() => setHasError(true)}
		/>
	);
}
