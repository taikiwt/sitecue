import * as matchers from "@testing-library/jest-dom/matchers";
import { expect } from "vitest";
import "@testing-library/jest-dom";
expect.extend(matchers);

import { cleanup } from "@testing-library/react";
import { setupServer } from "msw/node";
import { afterAll, afterEach, beforeAll, vi } from "vitest";
import { handlers } from "./src/mocks/handlers";

// Supabase や Next.js のルーターなど、ブラウザ特有の機能をモック化
vi.mock("next/navigation", () => ({
	useRouter: () => ({ push: vi.fn(), replace: vi.fn() }),
	useSearchParams: () => new URLSearchParams("url=example.com"),
}));

vi.mock("@/utils/supabase/client", () => ({
	createClient: () => ({
		auth: {
			getSession: vi.fn().mockResolvedValue({
				data: {
					session: { user: { id: "test-user" }, access_token: "fake-token" },
				},
				error: null,
			}),
		},
		from: vi.fn().mockReturnValue({
			select: vi.fn().mockReturnValue({
				eq: vi.fn().mockReturnValue({
					single: vi
						.fn()
						.mockResolvedValue({ data: { ai_usage_count: 0 }, error: null }),
				}),
			}),
		}),
	}),
}));

// MSWサーバーの設定
const server = setupServer(...handlers);

beforeAll(() => server.listen({ onUnhandledRequest: "error" }));
afterEach(() => {
	server.resetHandlers();
	cleanup();
	vi.clearAllMocks();
});

afterAll(() => server.close());
