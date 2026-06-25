"use client";

import { Globe } from "lucide-react";
import { useEffect, useRef, useState } from "react";

interface DomainFaviconProps {
	domain: string;
	sizeClassName?: string;
}

export function DomainFavicon({
	domain,
	sizeClassName = "w-5 h-5",
}: DomainFaviconProps) {
	const [isFallback, setIsFallback] = useState(false);
	const imgRef = useRef<HTMLImageElement>(null);

	// useEffect を早期リターン（if文）よりも「上」に配置
	useEffect(() => {
		if (imgRef.current && imgRef.current.complete) {
			if (
				imgRef.current.naturalWidth === 16 &&
				imgRef.current.naturalHeight === 16
			) {
				setIsFallback(true);
			}
		}
	}, []);

	// 早期リターン（条件分岐でのUI変更）は、すべてのフックが宣言し終わった「後」に行う
	if (isFallback || !domain) {
		return (
			<Globe
				className={`${sizeClassName} text-neutral-400 shrink-0 object-contain align-middle`}
				aria-hidden="true"
			/>
		);
	}

	const faviconUrl = `https://www.google.com/s2/favicons?domain=${encodeURIComponent(domain)}&sz=64`;

	return (
		// biome-ignore lint/performance/noImgElement: Dynamic external favicon URLs cannot be optimized using Next.js Image component
		<img
			ref={imgRef}
			src={faviconUrl}
			alt=""
			className={`${sizeClassName} shrink-0 object-contain align-middle`}
			onError={() => setIsFallback(true)}
			onLoad={(e) => {
				const img = e.currentTarget;
				if (img.naturalWidth === 16 && img.naturalHeight === 16) {
					setIsFallback(true);
				}
			}}
		/>
	);
}
