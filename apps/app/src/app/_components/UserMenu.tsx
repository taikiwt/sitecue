"use client";

import type { User as SupabaseUser } from "@supabase/supabase-js";
import { LogOut, Settings, User } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { CustomLink as Link } from "@/components/ui/custom-link";
import { createClient } from "@/utils/supabase/client";

export function UserMenu() {
	const router = useRouter();
	const supabase = createClient();
	const [user, setUser] = useState<SupabaseUser | null>(null);
	const [isMenuOpen, setIsMenuOpen] = useState(false);
	const menuRef = useRef<HTMLDivElement>(null);

	useEffect(() => {
		const getUser = async () => {
			const {
				data: { user },
			} = await supabase.auth.getUser();
			setUser(user);
		};
		getUser();
	}, [supabase]);

	// Close menu on click outside or Esc key
	useEffect(() => {
		const handleClickOutside = (event: MouseEvent) => {
			if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
				setIsMenuOpen(false);
			}
		};

		const handleEscKey = (event: KeyboardEvent) => {
			if (event.key === "Escape") {
				setIsMenuOpen(false);
			}
		};

		if (isMenuOpen) {
			document.addEventListener("mousedown", handleClickOutside);
			document.addEventListener("keydown", handleEscKey);
		}

		return () => {
			document.removeEventListener("mousedown", handleClickOutside);
			document.removeEventListener("keydown", handleEscKey);
		};
	}, [isMenuOpen]);

	const handleSignOut = async () => {
		await supabase.auth.signOut();
		router.push("/login");
		router.refresh();
	};

	if (!user) return null;

	return (
		<div className="relative w-full" ref={menuRef}>
			<button
				type="button"
				onClick={() => setIsMenuOpen(!isMenuOpen)}
				className="flex w-full items-center gap-3 rounded-xl p-2 transition-colors hover:bg-base-surface cursor-pointer text-left border border-transparent hover:border-base-border"
				aria-label="User menu"
			>
				<div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-base-border bg-base-surface text-action transition-colors shadow-sm overflow-hidden">
					{user.user_metadata?.avatar_url ? (
						// biome-ignore lint/performance/noImgElement: External OAuth avatar
						<img
							src={user.user_metadata.avatar_url}
							alt=""
							className="h-full w-full object-cover"
						/>
					) : (
						<User className="h-4 w-4" aria-hidden="true" />
					)}
				</div>
				<div className="flex-1 min-w-0">
					<p className="text-sm font-semibold text-action truncate">
						{user.email}
					</p>
					<p className="text-[10px] text-neutral-400 font-medium">My Account</p>
				</div>
			</button>

			{isMenuOpen && (
				<div className="absolute bottom-full left-0 mb-2 w-full origin-bottom-left rounded-xl border border-base-border bg-base-surface p-2 shadow-xl ring-1 ring-action/5 z-[100] animate-in fade-in zoom-in-95 duration-200">
					<Link
						href="/templates"
						onClick={() => setIsMenuOpen(false)}
						className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium text-gray-600 transition-colors hover:bg-base-bg hover:text-action cursor-pointer mb-1"
					>
						<Settings className="h-4 w-4" aria-hidden="true" />
						Manage Templates
					</Link>
					<button
						type="button"
						onClick={handleSignOut}
						className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium text-note-alert transition-colors hover:bg-note-alert/10 cursor-pointer"
					>
						<LogOut className="h-4 w-4" aria-hidden="true" />
						Log out
					</button>
				</div>
			)}
		</div>
	);
}
