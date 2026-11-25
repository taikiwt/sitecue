"use client";

import { ArrowLeft, Keyboard, LayoutGrid } from "lucide-react";
import { useMemo, useState } from "react";
import { CustomLink as Link } from "@/components/ui/custom-link";
import { cn } from "@/lib/utils";
import { useLayoutStore } from "@/store/useLayoutStore";
import {
	FEATURE_ITEMS,
	type GuideEnvironment,
	SHORTCUT_ITEMS,
} from "./guideData";

type GuideFilter = "all" | GuideEnvironment;

const FILTER_OPTIONS: Array<{ value: GuideFilter; label: string }> = [
	{ value: "all", label: "All" },
	{ value: "basecamp", label: "Basecamp" },
	{ value: "extension", label: "Extension" },
];

const ENV_LABELS: Record<GuideEnvironment, string> = {
	basecamp: "Basecamp",
	extension: "Extension",
};

export function GuideContainer() {
	const isSidebarOpen = useLayoutStore((state) => state.isSidebarOpen);
	const [activeFilter, setActiveFilter] = useState<GuideFilter>("all");

	const filteredShortcuts = useMemo(
		() =>
			SHORTCUT_ITEMS.filter(
				(item) => activeFilter === "all" || item.env === activeFilter,
			),
		[activeFilter],
	);

	const filteredFeatures = useMemo(
		() =>
			FEATURE_ITEMS.filter(
				(item) => activeFilter === "all" || item.env === activeFilter,
			),
		[activeFilter],
	);

	return (
		<div className="flex flex-col h-screen overflow-hidden bg-base-bg text-action">
			{/* 0ms UI Shell Header */}
			<header
				className={cn(
					"shrink-0 border-b border-base-border bg-base-bg px-4 py-4 md:px-8 transition-all duration-300",
					!isSidebarOpen && "md:pl-16",
				)}
			>
				<div className="mx-auto max-w-5xl flex flex-wrap items-center justify-between gap-3">
					<div className="flex items-center gap-3 min-w-0">
						<Link
							href="/"
							className="inline-flex items-center justify-center size-8 p-0 rounded-full hover-safe:bg-muted hover-safe:text-action transition-colors shrink-0"
							aria-label="Go back to Launchpad"
						>
							<ArrowLeft className="size-4 text-action" aria-hidden="true" />
						</Link>
						<div className="min-w-0">
							<h1 className="font-bold text-lg text-action leading-tight">
								Guide &amp; Shortcuts
							</h1>
							<p className="text-xs text-muted-foreground">
								Learn how to capture, organize, and weave your context.
							</p>
						</div>
					</div>

					<fieldset
						className="flex items-center gap-1 border-0 p-0 m-0 shrink-0"
						aria-label="Filter guide by environment"
					>
						{FILTER_OPTIONS.map((option) => (
							<button
								key={option.value}
								type="button"
								onClick={() => setActiveFilter(option.value)}
								aria-pressed={activeFilter === option.value}
								className={cn(
									"px-3 py-1 rounded-full text-xs font-medium transition-colors cursor-pointer",
									activeFilter === option.value
										? "bg-action text-action-text"
										: "bg-base-surface text-muted-foreground border border-base-border hover-safe:bg-muted hover-safe:text-action",
								)}
							>
								{option.label}
							</button>
						))}
					</fieldset>
				</div>
			</header>

			{/* Main Content */}
			<main className="flex-1 overflow-y-auto px-4 py-6 md:px-8 pb-24 md:pb-12">
				<div className="mx-auto max-w-5xl space-y-10">
					{/* Section 1: Keyboard Shortcuts */}
					<section aria-labelledby="guide-shortcuts-heading">
						<div className="flex items-center gap-2 mb-4">
							<Keyboard className="size-4 text-action" aria-hidden="true" />
							<h2
								id="guide-shortcuts-heading"
								className="text-base font-bold text-action"
							>
								Keyboard Shortcuts
							</h2>
						</div>

						<div className="rounded-2xl border border-base-border bg-base-surface divide-y divide-base-border overflow-hidden">
							{filteredShortcuts.map((item) => (
								<div
									key={item.id}
									className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 px-4 py-3"
								>
									<div className="min-w-0 space-y-0.5">
										<div className="flex items-center gap-2 flex-wrap">
											<span className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-medium bg-muted text-muted-foreground border border-base-border">
												{ENV_LABELS[item.env]}
											</span>
											<span className="text-sm font-medium text-action">
												{item.action}
											</span>
										</div>
										<p className="text-xs text-muted-foreground">
											{item.context}
										</p>
									</div>

									<kbd className="px-2.5 py-1 text-xs font-mono bg-base-bg border border-base-border rounded-full text-action shrink-0 w-fit">
										{item.keys}
									</kbd>
								</div>
							))}
						</div>
					</section>

					{/* Section 2: Features & Button Placement */}
					<section aria-labelledby="guide-features-heading">
						<div className="flex items-center gap-2 mb-4">
							<LayoutGrid className="size-4 text-action" aria-hidden="true" />
							<h2
								id="guide-features-heading"
								className="text-base font-bold text-action"
							>
								Features &amp; Button Placement
							</h2>
						</div>

						<div className="grid grid-cols-1 md:grid-cols-2 gap-4">
							{filteredFeatures.map((feature) => (
								<article
									key={feature.id}
									className="rounded-2xl border border-base-border bg-base-surface p-5 flex flex-col gap-3"
								>
									<div className="flex items-start justify-between gap-2">
										<h3 className="text-sm font-bold text-action leading-snug">
											{feature.title}
										</h3>
										<span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-medium bg-muted text-muted-foreground border border-base-border shrink-0">
											{ENV_LABELS[feature.env]}
										</span>
									</div>

									<p className="text-xs text-muted-foreground leading-relaxed">
										{feature.summary}
									</p>

									<p className="text-xs font-medium text-action bg-base-bg border border-base-border rounded-xl px-3 py-2">
										<span className="text-muted-foreground">Placement: </span>
										{feature.placement}
									</p>

									<ul className="space-y-2 pt-1">
										{feature.controls.map((control) => (
											<li
												key={control.id}
												className="text-xs leading-relaxed text-muted-foreground"
											>
												<span className="font-semibold text-action">
													{control.name}
												</span>
												<span> — {control.description}</span>
											</li>
										))}
									</ul>
								</article>
							))}
						</div>
					</section>
				</div>
			</main>
		</div>
	);
}
