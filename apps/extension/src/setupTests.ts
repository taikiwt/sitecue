import "@testing-library/jest-dom";
import { vi } from "vitest";

// 環境変数のデフォルトモック
const env = import.meta.env as unknown as Record<string, string>;
env.VITE_SUPABASE_URL = env.VITE_SUPABASE_URL || "https://example.supabase.co";
env.VITE_SUPABASE_ANON_KEY = env.VITE_SUPABASE_ANON_KEY || "dummy-anon-key";

// Chrome APIのグローバルモック
vi.stubGlobal("chrome", {
	runtime: {
		sendMessage: vi.fn(),
		lastError: undefined,
	},
	storage: {
		local: {
			get: vi.fn(),
			set: vi.fn(),
			remove: vi.fn(),
		},
	},
	tabs: {
		query: vi.fn(),
		get: vi.fn(),
		onUpdated: { addListener: vi.fn(), removeListener: vi.fn() },
		onActivated: { addListener: vi.fn(), removeListener: vi.fn() },
	},
	windows: {
		getCurrent: vi.fn().mockResolvedValue({ id: 1 }),
	},
	identity: {
		getRedirectURL: vi.fn().mockReturnValue("https://app.chromiumapp.org/"),
		launchWebAuthFlow: vi.fn(),
	},
	sidePanel: {
		setPanelBehavior: vi.fn().mockResolvedValue(undefined),
	},
});

// Supabaseのグローバルモック
vi.mock("./supabaseClient", () => ({
	supabase: {
		auth: {
			onAuthStateChange: vi.fn(() => ({
				data: { subscription: { unsubscribe: vi.fn() } },
			})),
			getSession: vi
				.fn()
				.mockResolvedValue({ data: { session: null }, error: null }),
		},
		from: vi.fn().mockReturnValue({
			select: vi.fn().mockReturnThis(),
			eq: vi.fn().mockReturnThis(),
			or: vi.fn().mockReturnThis(),
			maybeSingle: vi.fn().mockResolvedValue({ data: null }),
			upsert: vi.fn().mockResolvedValue({ error: null }),
			delete: vi.fn().mockResolvedValue({ error: null }),
		}),
	},
	localClient: {
		from: vi.fn().mockReturnValue({
			select: vi.fn().mockReturnThis(),
			eq: vi.fn().mockReturnThis(),
			or: vi.fn().mockReturnThis(),
			maybeSingle: vi.fn().mockResolvedValue({ data: null }),
			upsert: vi.fn().mockResolvedValue({ error: null }),
			delete: vi.fn().mockResolvedValue({ error: null }),
		}),
	},
}));
