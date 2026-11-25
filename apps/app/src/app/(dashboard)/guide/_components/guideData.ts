export type GuideEnvironment = "basecamp" | "extension";

export interface ShortcutGuideItem {
	id: string;
	env: GuideEnvironment;
	keys: string;
	action: string;
	context: string;
}

export interface FeatureGuideItem {
	id: string;
	env: GuideEnvironment;
	title: string;
	summary: string;
	placement: string;
	controls: Array<{
		id: string;
		name: string;
		description: string;
	}>;
}

export const SHORTCUT_ITEMS: ShortcutGuideItem[] = [
	{
		id: "bc-save",
		env: "basecamp",
		keys: "Ctrl / ⌘ + Enter",
		action: "Save note or diary",
		context: "Quick Note Modal / Notes Editor",
	},
	{
		id: "bc-find",
		env: "basecamp",
		keys: "Ctrl / ⌘ + F",
		action: "Find word in current note or diary",
		context: "Notes Detail / Diary Detail",
	},
	{
		id: "bc-find-nav",
		env: "basecamp",
		keys: "Enter / Shift + Enter",
		action: "Jump to next / previous match",
		context: "In-Note Search Bar",
	},
	{
		id: "bc-find-esc",
		env: "basecamp",
		keys: "Esc",
		action: "Clear in-note search query",
		context: "In-Note Search Bar",
	},
	{
		id: "bc-hint",
		env: "basecamp",
		keys: "Ctrl / ⌘ + J or Alt + J",
		action: "Trigger AI writing completion hint",
		context: "Draft Studio Editor",
	},
	{
		id: "bc-hint-accept",
		env: "basecamp",
		keys: "Tab / Esc",
		action: "Accept / dismiss AI completion hint",
		context: "Draft Studio Editor",
	},
	{
		id: "bc-indent",
		env: "basecamp",
		keys: "Tab / Shift + Tab",
		action: "Indent / outdent list items",
		context: "Markdown Editors",
	},
	{
		id: "bc-paste-url",
		env: "basecamp",
		keys: "Paste URL on selection",
		action: "Convert selected text into Markdown link",
		context: "Markdown Editors",
	},
	{
		id: "ext-toggle",
		env: "extension",
		keys: "Ctrl / ⌘ + Shift + E",
		action: "Open / close browser side panel",
		context: "Browser Global",
	},
	{
		id: "ext-save",
		env: "extension",
		keys: "Ctrl / ⌘ + Enter",
		action: "Save note or append diary",
		context: "Side Panel Input / Note Edit",
	},
	{
		id: "ext-esc",
		env: "extension",
		keys: "Esc",
		action: "Close modal / exit maximized pane",
		context: "Side Panel",
	},
	{
		id: "ext-indent",
		env: "extension",
		keys: "Tab / Shift + Tab",
		action: "Indent / outdent list or command snippet",
		context: "Note / Command Editors",
	},
	{
		id: "ext-list",
		env: "extension",
		keys: "- / 1. + Enter",
		action: "Auto-continue list (Enter on empty item to exit)",
		context: "Note / Diary Editors",
	},
	{
		id: "ext-paste-url",
		env: "extension",
		keys: "Paste URL on selection",
		action: "Convert selected text into Markdown link",
		context: "Note / Diary Editors",
	},
];

export const FEATURE_ITEMS: FeatureGuideItem[] = [
	{
		id: "bc-nav",
		env: "basecamp",
		title: "Global Navigation Rail & Bottom Bar",
		summary:
			"Switch between Launchpad, Notes, global search, quick capture, and account settings.",
		placement: "Left rail on desktop / bottom bar on mobile",
		controls: [
			{
				id: "bc-nav-home",
				name: "Home",
				description:
					"Open Launchpad with Today's Focus, Weekly Progress, and Domain Activity.",
			},
			{
				id: "bc-nav-new",
				name: "sitecue Logo (+)",
				description:
					"Launch Quick Note, Blank Draft in Studio, or Daily Diary capture.",
			},
			{
				id: "bc-nav-search",
				name: "Search",
				description:
					"Search across all notes, domains, pages, drafts, and diaries.",
			},
			{
				id: "bc-nav-notes",
				name: "Notes",
				description:
					"Open the 4-tab workspace for Domains, Inbox, Drafts, and Diaries.",
			},
			{
				id: "bc-nav-user",
				name: "User Avatar",
				description:
					"Check plan quota, manage Templates, open Trash, view Guide, or log out.",
			},
		],
	},
	{
		id: "bc-notes-list",
		env: "basecamp",
		title: "Notes Workspace & 4-Tab Views",
		summary:
			"Browse and filter captured context grouped by domain, global inbox, studio drafts, or daily diaries.",
		placement: "Middle pane in /notes",
		controls: [
			{
				id: "bc-notes-tabs",
				name: "Domains / Inbox / Drafts / Diaries",
				description:
					"Switch primary context view; sort domains by Most Notes or Name (A-Z).",
			},
			{
				id: "bc-notes-filters",
				name: "All / Info / Alert / Idea & Resolved Toggle",
				description: "Filter notes by type or reveal completed items.",
			},
			{
				id: "bc-notes-actions",
				name: "+ / Select Mode / Bulk Copy",
				description:
					"Create a note in context, select multiple notes to move to Trash, or copy as Text/JSON.",
			},
		],
	},
	{
		id: "bc-note-detail",
		env: "basecamp",
		title: "Note Detail, In-Note Search & Actions",
		summary:
			"Read rendered Markdown with preserved spacing, search words inside long notes, and manage status.",
		placement: "Right pane in /notes (full-screen slide-in on mobile)",
		controls: [
			{
				id: "bc-detail-search",
				name: "Find in note...",
				description:
					"Highlight matching keywords inside the active note/diary and jump between matches.",
			},
			{
				id: "bc-detail-status",
				name: "Status Badge & Pin / Star",
				description:
					"Toggle resolved status, pin notes to the top of lists, or mark as favorite.",
			},
			{
				id: "bc-detail-edit",
				name: "Edit / Copy / More (…)",
				description:
					"Edit Markdown content, copy raw text, or move the note/draft to Trash.",
			},
		],
	},
	{
		id: "bc-studio",
		env: "basecamp",
		title: "Draft Studio & AI Weave",
		summary:
			"Author long-form documents with outline navigation, self-review notes, and AI synthesis.",
		placement: "Left editor & right 3-tab panel in /studio/[id]",
		controls: [
			{
				id: "bc-studio-header",
				name: "Undo / Redo / Save / More (…)",
				description:
					"Manage revision history, save drafts without losing scroll position, save as Template, or move to Trash.",
			},
			{
				id: "bc-studio-outline",
				name: "OUTLINE Tab",
				description:
					"Filter Markdown headings and jump directly to sections in the editor.",
			},
			{
				id: "bc-studio-review",
				name: "REVIEW Tab & WEAVE WITH AI",
				description:
					"Add review notes or run AI Review, then synthesize active notes into your draft.",
			},
			{
				id: "bc-studio-materials",
				name: "MATERIALS Tab",
				description: "Search past notes and reference pages while writing.",
			},
		],
	},
	{
		id: "bc-diary-trash",
		env: "basecamp",
		title: "Daily Diary, Templates & Trash",
		summary:
			"Log timestamped daily thoughts, customize writing templates, and recover deleted items.",
		placement:
			"Launchpad Today's Focus, /diaries/[date], /templates, and /trash",
		controls: [
			{
				id: "bc-diary-studio",
				name: "Diary Studio & Key Events",
				description:
					"Record up to 10 key events per day and review notes/drafts created on that date.",
			},
			{
				id: "bc-templates",
				name: "Manage Templates",
				description:
					"Configure reusable boilerplate text, max character limits, and custom AI Weave prompts.",
			},
			{
				id: "bc-trash",
				name: "Trash (7 days Free / 30 days Pro)",
				description:
					"Restore accidentally deleted notes and drafts or permanently delete them.",
			},
		],
	},
	{
		id: "ext-header",
		env: "extension",
		title: "Side Panel Header & Context Lock",
		summary:
			"Stay anchored to the active tab or lock context while browsing across multiple pages.",
		placement: "Top card header in the Chrome side panel",
		controls: [
			{
				id: "ext-header-lock",
				name: "Lock / Unlock Icon",
				description:
					"Pin current page notes so they stay visible even when switching browser tabs.",
			},
			{
				id: "ext-header-links",
				name: "Title / Links Pill Button",
				description:
					"Open domain label/color settings and Quick Links (related URLs & ENV environment switchers).",
			},
			{
				id: "ext-header-diary",
				name: "Calendar Icon",
				description:
					"Open the 3-day quick Diary drawer to view or edit recent logs.",
			},
			{
				id: "ext-header-avatar",
				name: "Profile Avatar",
				description:
					"Switch language (EN / JA), open Basecamp, view shortcuts, or log out.",
			},
		],
	},
	{
		id: "ext-quick-panel",
		env: "extension",
		title: "Quick Scratchpad (Note & Command)",
		summary:
			"Jot down temporary Markdown drafts or multi-line terminal commands stored locally.",
		placement: "Collapsible card below the header",
		controls: [
			{
				id: "ext-qp-note",
				name: "Note Tab",
				description:
					"Draft Markdown with live preview (Eye icon), then send directly to Inbox (Note) or Today's Diary (Diary).",
			},
			{
				id: "ext-qp-cmd",
				name: "Command Tab",
				description:
					"Dark console scratchpad with 2-space auto-indent for CLI commands and snippets.",
			},
			{
				id: "ext-qp-max",
				name: "Maximize Icon",
				description:
					"Expand the Quick Panel to fill the entire side panel height.",
			},
		],
	},
	{
		id: "ext-notes",
		env: "extension",
		title: "Scope Tabs & Note Cards",
		summary:
			"Organize site-specific cues by exact URL, entire domain, or global inbox.",
		placement: "Main list area in the Chrome side panel",
		controls: [
			{
				id: "ext-notes-scope",
				name: "Page / Domain / Inbox Tabs",
				description:
					"Switch between exact page notes, domain-wide notes, and global inbox notes.",
			},
			{
				id: "ext-notes-filter",
				name: "Sliders Icon & Central + Button",
				description:
					"Filter by type, search text, or #tags, and open the floating note/diary composer.",
			},
			{
				id: "ext-notes-card",
				name: "Card Controls (Drag / Status / Edit / Star / Pin)",
				description:
					"Reorder via drag handle, toggle resolved state, edit inline, or star/pin important cues.",
			},
		],
	},
];
