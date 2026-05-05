import type { Draft, Note } from "../../../../types/app";

export function createMockNote(overrides?: Partial<Note>): Note {
	return {
		id: "mock-note-123",
		user_id: "mock-user-123",
		url_pattern: "example.com",
		content: "Default mock content",
		created_at: new Date().toISOString(),
		updated_at: new Date().toISOString(),
		scope: "domain",
		note_type: "info",
		is_resolved: false,
		is_pinned: false,
		is_favorite: false,
		is_expanded: false,
		sort_order: 0,
		tags: [],
		draft_id: null,
		...overrides,
	} as Note;
}

export function createMockDraft(overrides?: Partial<Draft>): Draft {
	return {
		id: "mock-draft-123",
		user_id: "mock-user-123",
		title: "Default mock draft title",
		content: "Default mock draft content",
		created_at: new Date().toISOString(),
		updated_at: new Date().toISOString(),
		metadata: null,
		template_id: null,
		sitecue_templates: null,
		tags: [],
		...overrides,
	} as Draft;
}
