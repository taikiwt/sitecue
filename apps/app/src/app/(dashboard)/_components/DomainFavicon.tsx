"use client";

import { useState } from "react";
import { Globe } from "lucide-react";

interface DomainFaviconProps {
	domain: string;
	sizeClassName?: string;
}

export function DomainFavicon({ domain, sizeClassName = "w-5 h-5" }: DomainFaviconProps) {
	const [isFallback, setIsFallback] = useState(false);

	// 1. 代替フラグが立った、またはドメインが空の時は即座に美しいLucideのGlobeを返す
	if (isFallback || !domain) {
		return (
			<Globe
				className={`${sizeClassName} text-neutral-400 shrink-0 object-contain align-middle`}
				aria-hidden="true"
			/>
		);
	}

	// 最も安定しているオリジナルのAPIを、大きめのサイズ（sz=64）で叩く
	const faviconUrl = `https://www.google.com/s2/favicons?domain=${encodeURIComponent(domain)}&sz=64`;

	return (
		// biome-ignore lint/performance/noImgElement: Dynamic external favicon URLs cannot be optimized using Next.js Image component
		<img
			src={faviconUrl}
			alt=""
			className={`${sizeClassName} shrink-0 object-contain align-middle`}
			onError={() => setIsFallback(true)}
			onLoad={(e) => {
				// 💡 ユーザーのアイデア：Googleのデフォルト地球儀は sz=64 を指定していても強制的に 16x16 で届く
				const img = e.currentTarget;
				if (img.naturalWidth === 16 && img.naturalHeight === 16) {
					setIsFallback(true);
				}
			}}
		/>
	);
}
