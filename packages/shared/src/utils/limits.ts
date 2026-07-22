export const SHARED_LIMITS = {
	// 🌱 新設: プラン別・種別ごとの制限構造
	NOTE_LENGTH: {
		FREE: 10000,
		PRO: 30000,
	},
	DIARY_LENGTH: {
		FREE: 50000,
		PRO: 100000,
	},

	// 🛡️ 後方互換性維持（既存の参照箇所を壊さないための定数）
	MAX_NOTE_LENGTH: 10000,
	MAX_DRAFT_LENGTH: 100000,
	MAX_TEMPLATE_LENGTH: 5000,
	NOTES_LIMIT: {
		MAX_FREE: 500,
		WARNING_THRESHOLD: 450,
	},
	DRAFTS_LIMIT: {
		MAX_FREE: 50,
		WARNING_THRESHOLD: 45,
	},
} as const;
