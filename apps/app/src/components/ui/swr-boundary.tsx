"use client";

import { type ReactNode, useEffect, useState } from "react";

const SKELETON_HOLD_MS = 200;

export interface SWRBoundaryProps<T> {
	data: T | undefined;
	isLoading: boolean;
	fallback: ReactNode;
	children: (data: T) => ReactNode;
	/** データが描画可能な状態まで揃っているかを判定するオプショナル関数 */
	isDataReady?: (data: T) => boolean;
}

export function SWRBoundary<T>({
	data,
	isLoading,
	fallback,
	children,
	isDataReady,
}: SWRBoundaryProps<T>) {
	const isReady =
		data !== undefined && (isDataReady ? isDataReady(data) : true);
	const [showSkeleton, setShowSkeleton] = useState(!isReady);

	useEffect(() => {
		if (isReady) {
			if (showSkeleton) {
				const timer = setTimeout(() => {
					setShowSkeleton(false);
				}, SKELETON_HOLD_MS);
				return () => clearTimeout(timer);
			}
			setShowSkeleton(false);
			return;
		}

		if (isLoading) {
			setShowSkeleton(true);
		}
	}, [isReady, isLoading, showSkeleton]);

	if (showSkeleton || !isReady || data === undefined) {
		return <>{fallback}</>;
	}

	return <>{children(data)}</>;
}
