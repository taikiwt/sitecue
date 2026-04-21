"use client";

import { ExternalLink, Pin, Plus, Trash2, X } from "lucide-react";
import { useOptimistic, useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import type { PinnedSite } from "../../../../../types/app";
import { addPinnedSite, deletePinnedSite } from "../_actions/pinned-sites";

interface PinnedSitesManagerProps {
	initialSites: PinnedSite[];
}

export function PinnedSitesManager({ initialSites }: PinnedSitesManagerProps) {
	const [isAdding, setIsAdding] = useState(false);
	const [isPending, startTransition] = useTransition();
	const [optimisticSites, addOptimisticAction] = useOptimistic<
		PinnedSite[],
		{ type: "add"; site: PinnedSite } | { type: "delete"; id: string }
	>(initialSites, (state, action) => {
		if (action.type === "add") {
			return [action.site, ...state];
		}
		if (action.type === "delete") {
			return state.filter((s) => s.id !== action.id);
		}
		return state;
	});

	const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
		e.preventDefault();
		const formData = new FormData(e.currentTarget);
		const title = formData.get("title") as string;
		const url = formData.get("url") as string;

		if (!title || !url) return;

		const tempId = Math.random().toString();
		const newSite: PinnedSite = {
			id: tempId,
			title,
			url,
			user_id: "",
			created_at: new Date().toISOString(),
		};

		startTransition(async () => {
			addOptimisticAction({ type: "add", site: newSite });
			setIsAdding(false);
			try {
				await addPinnedSite(formData);
			} catch (error) {
				console.error("Failed to add pinned site:", error);
			}
		});
	};

	const handleDelete = async (id: string) => {
		startTransition(async () => {
			addOptimisticAction({ type: "delete", id });
			try {
				await deletePinnedSite(id);
			} catch (error) {
				console.error("Failed to delete pinned site:", error);
			}
		});
	};

	const getHostname = (url: string) => {
		try {
			return new URL(url).hostname;
		} catch {
			return url;
		}
	};

	return (
		<section className="mb-16">
			<div className="mb-8 flex items-center justify-between">
				<div className="flex items-center gap-2">
					<Pin className="w-5 h-5 text-neutral-400" aria-hidden="true" />
					<h2 className="text-xl font-light tracking-tight text-neutral-800">
						Pinned Sites
					</h2>
				</div>
				<Button
					type="button"
					variant="ghost"
					size="sm"
					onClick={() => setIsAdding(!isAdding)}
					className="text-gray-500 hover:text-action cursor-pointer"
					aria-label={isAdding ? "Close add form" : "Add pinned site"}
				>
					{isAdding ? (
						<>
							<X className="w-4 h-4" /> Cancel
						</>
					) : (
						<>
							<Plus className="w-4 h-4" /> Add Site
						</>
					)}
				</Button>
			</div>

			{isAdding && (
				<form
					onSubmit={handleSubmit}
					className="mb-8 p-6 rounded-2xl border border-base-border bg-base-surface shadow-sm animate-in fade-in slide-in-from-top-2 duration-200"
				>
					<div className="grid gap-4 sm:grid-cols-2">
						<div className="space-y-2">
							<label
								htmlFor="title"
								className="text-xs font-semibold text-gray-500 uppercase tracking-wider"
							>
								Title
							</label>
							<input
								type="text"
								id="title"
								name="title"
								required
								placeholder="e.g. My Blog"
								className="w-full rounded-lg border border-base-border px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-action transition-shadow"
							/>
						</div>
						<div className="space-y-2">
							<label
								htmlFor="url"
								className="text-xs font-semibold text-gray-500 uppercase tracking-wider"
							>
								URL
							</label>
							<input
								type="url"
								id="url"
								name="url"
								required
								placeholder="https://example.com"
								className="w-full rounded-lg border border-base-border px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-action transition-shadow"
							/>
						</div>
					</div>
					<div className="mt-6 flex justify-end">
						<Button
							type="submit"
							disabled={isPending}
							className="rounded-full px-6"
						>
							{isPending ? "Adding..." : "Add Pinned Site"}
						</Button>
					</div>
				</form>
			)}

			<div className="grid gap-4 grid-cols-2 sm:grid-cols-4 lg:grid-cols-5">
				{optimisticSites.length === 0 && !isAdding && (
					<div className="col-span-full py-12 flex flex-col items-center justify-center rounded-2xl border-2 border-dashed border-base-border bg-base-surface/50">
						<p className="text-sm text-gray-400 italic">
							No pinned sites yet. Add your favorite tools or references here.
						</p>
					</div>
				)}
				{optimisticSites.map((site) => (
					<div
						key={site.id}
						className="group relative flex flex-col justify-between rounded-xl border border-base-border bg-base-surface p-4 transition-all hover:border-action hover:ring-1 hover:ring-action"
					>
						<div className="mb-3 flex items-start justify-between">
							<div className="rounded-lg bg-base-bg p-2 group-hover:bg-base-surface transition-colors">
								<ExternalLink className="w-4 h-4 text-gray-600" />
							</div>
							<Button
								type="button"
								variant="ghost"
								size="icon-sm"
								onClick={() => handleDelete(site.id)}
								disabled={isPending}
								className="opacity-0 group-hover:opacity-100 text-gray-400 hover:text-note-alert hover:bg-note-alert/10 cursor-pointer"
								title="Delete"
							>
								<Trash2 className="w-4 h-4" />
							</Button>
						</div>
						<a
							href={site.url}
							target="_blank"
							rel="noopener noreferrer"
							className="block cursor-pointer outline-none"
						>
							<h3 className="font-bold text-action line-clamp-1 group-hover:underline">
								{site.title}
							</h3>
							<p className="mt-1 text-xs text-neutral-500 truncate">
								{getHostname(site.url)}
							</p>
						</a>
					</div>
				))}
			</div>
		</section>
	);
}
