"use client";

import { Globe, Laptop } from "lucide-react";
import { useEffect, useRef, useState } from "react";

interface DomainFaviconProps {
	domain: string;
	sizeClassName?: string;
}

function isLocalDomain(domain: string): boolean {
	if (!domain) return false;
	// ポート番号 (:3000 等) およびプロトコルや末尾スラッシュを除去した純粋なホスト名を抽出
	const host = domain.toLowerCase().trim().split("/")[0].split(":")[0];
	return (
		host === "localhost" ||
		host === "127.0.0.1" ||
		host === "0.0.0.0" ||
		host.endsWith(".local")
	);
}

export function DomainFavicon({
	domain,
	sizeClassName = "w-5 h-5",
}: DomainFaviconProps) {
	const [isFallback, setIsFallback] = useState(false);
	const imgRef = useRef<HTMLImageElement>(null);

	useEffect(() => {
		if (imgRef.current?.complete) {
			if (
				imgRef.current.naturalWidth === 16 &&
				imgRef.current.naturalHeight === 16
			) {
				setIsFallback(true);
			}
		}
	}, []);

	if (isLocalDomain(domain)) {
		return (
			<Laptop
				className={`${sizeClassName} text-neutral-400 shrink-0 object-contain align-middle`}
				aria-hidden="true"
			/>
		);
	}

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
