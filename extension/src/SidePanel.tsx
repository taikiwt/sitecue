import type { Session } from "@supabase/supabase-js";
import { createClient } from "@supabase/supabase-js";
import { Loader2 } from "lucide-react";
import { useState } from "react";
import { Toaster } from "react-hot-toast";
import FilterBar from "./components/FilterBar";
import Header from "./components/Header";
import LoginScreen from "./components/LoginScreen";
import NoteInput from "./components/NoteInput";
import NoteList from "./components/NoteList";
import QuickLinks from "./components/QuickLinks";
import { useAuth } from "./hooks/useAuth";
import { useCurrentTab } from "./hooks/useCurrentTab";
import { useNotes } from "./hooks/useNotes";
import { useUserStats } from "./hooks/useUserStats";

import { getScopeUrls } from "./utils/url";

// 安全装置：指定ミリ秒を超えたら強制的にPromiseをRejectする
const withTimeout = <T,>(promise: Promise<T>, ms: number): Promise<T> => {
	let timeoutId: ReturnType<typeof setTimeout>;
	const timeoutPromise = new Promise<never>((_, reject) => {
		timeoutId = setTimeout(
			() => reject(new Error("Timeout: 処理が長すぎます")),
			ms,
		);
	});
	return Promise.race([promise, timeoutPromise]).finally(() =>
		clearTimeout(timeoutId),
	);
};

const MAX_FREE_NOTES = 200;

export default function SidePanel() {
	const {
		session,
		authLoading,
		authError,
		sessionLoading,
		handleLogout,
		handleSocialLogin,
	} = useAuth();

	if (sessionLoading) {
		return (
			<div className="w-full h-screen bg-gray-50 flex flex-col items-center justify-center font-sans">
				<Loader2 className="w-8 h-8 animate-spin text-gray-500" />
			</div>
		);
	}

	if (!session) {
		return (
			<LoginScreen
				authError={authError}
				authLoading={authLoading}
				handleSocialLogin={handleSocialLogin}
			/>
		);
	}

	return <NotesUI session={session} onLogout={handleLogout} />;
}

function NotesUI({
	session,
	onLogout,
}: {
	session: Session;
	onLogout: () => void;
}) {
	const { currentFullUrl, url, title } = useCurrentTab();
	const { userPlan, totalNoteCount, setTotalNoteCount, userStatsLoading } =
		useUserStats(session);

	const {
		notes,
		loading,
		addNote,
		updateNote,
		deleteNote,
		toggleResolved,
		toggleFavorite,
		togglePinned,
		updateNoteOrder,
		toggleNoteExpansion,
	} = useNotes(session, currentFullUrl, setTotalNoteCount);

	// 🔍 フィルタリング用ステート
	const [filterType, setFilterType] = useState<
		"all" | "info" | "alert" | "idea"
	>("all");
	const [showResolved, setShowResolved] = useState(false);
	const [viewScope, setViewScope] = useState<"exact" | "domain" | "inbox">(
		"exact",
	);
	const [searchQuery, setSearchQuery] = useState("");
	const [isWeaving, setIsWeaving] = useState(false);

	const filteredNotesByScope = notes.filter((n) => {
		if (viewScope === "inbox") {
			if (n.scope !== "inbox") return false;
		} else {
			if (n.scope !== viewScope) return false;
		}

		if (searchQuery && n.content) {
			if (!n.content.toLowerCase().includes(searchQuery.toLowerCase())) {
				return false;
			}
		}

		return true;
	});

	return (
		<div className="w-full h-screen bg-gray-50 flex flex-col font-sans">
			<Toaster
				position="bottom-center"
				toastOptions={{
					style: {
						fontSize: "12px",
						padding: "8px 12px",
						borderRadius: "8px",
						background: "#333",
						color: "#fff",
					},
				}}
			/>
			<Header
				url={url}
				title={title}
				domain={currentFullUrl ? getScopeUrls(currentFullUrl).domain : ""}
				session={session}
				onLogout={onLogout}
			/>

			<QuickLinks
				currentDomain={
					currentFullUrl ? getScopeUrls(currentFullUrl).domain : null
				}
			/>

			<FilterBar
				filterType={filterType}
				setFilterType={setFilterType}
				showResolved={showResolved}
				setShowResolved={setShowResolved}
				viewScope={viewScope}
				setViewScope={setViewScope}
				searchQuery={searchQuery}
				setSearchQuery={setSearchQuery}
				filteredNotes={filteredNotesByScope}
			/>

			<div className="flex-1 overflow-y-auto p-4 space-y-6">
				<NoteList
					notes={filteredNotesByScope}
					loading={loading}
					filterType={filterType}
					showResolved={showResolved}
					currentFullUrl={currentFullUrl}
					viewScope={viewScope}
					onUpdate={updateNote}
					onDelete={deleteNote}
					onToggleResolved={toggleResolved}
					onToggleFavorite={toggleFavorite}
					onTogglePinned={togglePinned}
					onUpdateNoteOrder={updateNoteOrder}
					onToggleExpansion={toggleNoteExpansion}
				/>

				{currentFullUrl && notes.length > 0 && (
					<div className="pt-2 flex justify-center">
						<button
							type="button"
							disabled={isWeaving}
							onClick={async () => {
								if (!currentFullUrl) return;
								setIsWeaving(true);
								try {
									const urlObj = new URL(currentFullUrl);
									const originPattern = `${urlObj.origin}/*`;
									const granted = await chrome.permissions.request({
										origins: [originPattern],
									});
									if (!granted) {
										throw new Error("Permission denied");
									}

									const dashboardUrl =
										import.meta.env.VITE_WEB_URL || "http://127.0.0.1:3000";
									const cleanUrl = currentFullUrl.replace(/^https?:\/\//, "");

									const tabs = await chrome.tabs.query({
										active: true,
										currentWindow: true,
									});
									const tab = tabs[0];
									let contextId = "";

									if (tab?.id) {
										const results = await withTimeout(
											chrome.scripting.executeScript({
												target: { tabId: tab.id },
												func: () => document.body.innerText.slice(0, 50000),
											}),
											3000,
										);

										if (results?.[0]?.result) {
											const pageText = results[0].result as string;

											const supabase = createClient(
												import.meta.env.VITE_SUPABASE_URL,
												import.meta.env.VITE_SUPABASE_ANON_KEY,
												{
													global: {
														headers: {
															Authorization: `Bearer ${session.access_token}`,
														},
													},
												},
											);

											const { data, error } = await supabase
												.from("sitecue_page_contents")
												.insert({
													user_id: session.user.id,
													url: currentFullUrl,
													content: pageText,
												})
												.select()
												.single();

											if (!error && data) {
												contextId = data.id as string;
											}
										}
									}

									let targetUrl = `${dashboardUrl}/weave?url=${encodeURIComponent(cleanUrl)}`;
									if (contextId) {
										targetUrl += `&context_id=${contextId}`;
									}
									window.open(targetUrl, "_blank");
								} catch (err: unknown) {
									console.warn(
										"Weave aborted:",
										err instanceof Error ? err.message : "Unknown error",
									);
									const dashboardUrl =
										import.meta.env.VITE_WEB_URL || "http://127.0.0.1:3000";
									const cleanUrl = currentFullUrl.replace(/^https?:\/\//, "");
									window.open(
										`${dashboardUrl}/weave?url=${encodeURIComponent(cleanUrl)}`,
										"_blank",
									);
									window.close();
								} finally {
									setIsWeaving(false);
								}
							}}
							className="cursor-pointer flex items-center gap-1.5 px-3 py-2 text-xs font-medium text-neutral-600 bg-white border border-gray-200 rounded-md hover:bg-gray-50 hover:text-neutral-900 transition-colors shadow-sm w-full justify-center disabled:opacity-50 disabled:cursor-not-allowed"
						>
							{isWeaving ? (
								<>
									<Loader2
										className="w-4 h-4 animate-spin text-neutral-600"
										aria-hidden="true"
									/>
									錬成準備中...
								</>
							) : (
								"✨ 錬成する (Weave Ideas)"
							)}
						</button>
					</div>
				)}
			</div>

			{userStatsLoading ? (
				<div className="p-4 bg-white border-t border-gray-200 space-y-3">
					<div className="flex items-center justify-center py-4">
						<Loader2 className="w-5 h-5 animate-spin text-gray-300" />
					</div>
				</div>
			) : (
				<NoteInput
					userPlan={userPlan}
					totalNoteCount={totalNoteCount}
					maxFreeNotes={MAX_FREE_NOTES}
					onAddNote={addNote}
				/>
			)}
		</div>
	);
}
