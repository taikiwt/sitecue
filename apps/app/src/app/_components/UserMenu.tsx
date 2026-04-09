"use client";

import type { User as SupabaseUser } from "@supabase/supabase-js";
import { LogOut, User } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
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
		<div className="relative" ref={menuRef}>
			<button
				type="button"
				onClick={() => setIsMenuOpen(!isMenuOpen)}
				className="flex h-10 w-10 items-center justify-center rounded-full border border-neutral-200 bg-white text-neutral-600 transition-colors hover:bg-neutral-50 cursor-pointer shadow-sm"
				aria-label="User menu"
			>
				{user.user_metadata?.avatar_url ? (
					// biome-ignore lint/performance/noImgElement: External OAuth avatar
					<img
						src={user.user_metadata.avatar_url}
						alt="User avatar"
						className="h-full w-full rounded-full object-cover"
					/>
				) : (
					<User className="h-5 w-5" />
				)}
			</button>

			{isMenuOpen && (
				<div className="absolute right-0 bottom-full mb-2 md:bottom-auto md:mt-2 w-56 origin-bottom-right md:origin-top-right rounded-xl border border-neutral-200 bg-white p-2 shadow-xl ring-1 ring-black/5 z-[100]">
					<div className="px-3 py-2 border-b border-neutral-100 mb-1">
						<p className="text-xs font-semibold text-neutral-900 truncate">
							{user.email}
						</p>
					</div>
					<button
						type="button"
						onClick={handleSignOut}
						className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium text-red-600 transition-colors hover:bg-red-50 cursor-pointer"
					>
						<LogOut className="h-4 w-4" />
						Log out
					</button>
				</div>
			)}
		</div>
	);
}
