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
	WARNING_THRESHOLD: 3,
} as const;
