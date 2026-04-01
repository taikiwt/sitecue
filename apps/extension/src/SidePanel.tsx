import type { Session } from "@supabase/supabase-js";
import { Loader2 } from "lucide-react";
import { useState } from "react";
import { Toaster } from "react-hot-toast";
import AiActionBar from "./components/AiActionBar";
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
	const {
		userPlan,
		aiUsageCount,
		totalNoteCount,
		setTotalNoteCount,
		userStatsLoading,
	} = useUserStats(session);

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

			{currentFullUrl && notes.length > 0 && (
				<AiActionBar
					currentFullUrl={currentFullUrl}
					session={session}
					aiUsageCount={aiUsageCount}
					userPlan={userPlan}
				/>
			)}

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
