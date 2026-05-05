// フロント側の表示分けのために使う
export const NOTES_LIMIT = {
	MAX_FREE: 500, // 500
	WARNING_THRESHOLD: 450, // 450
} as const;

export const DRAFTS_LIMIT = {
	MAX_FREE: 50, // 50
	WARNING_THRESHOLD: 45, // 45
} as const;

export const AI_LIMIT = {
	MAX_FREE: 3,
	MAX_PRO: 100,
	WARNING_THRESHOLD_FREE: 3,
	WARNING_THRESHOLD_PRO: 90,
} as const;

export const APP_LIMITS = {
	MAX_NOTE_LENGTH: 10000,
	MAX_DRAFT_LENGTH: 100000,
	MAX_TEMPLATE_LENGTH: 5000,
} as const;
