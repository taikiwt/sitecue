import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import SearchInput from "./SearchInput";

// Mock useRouter, usePathname, and useSearchParams
const mockReplace = vi.fn((url: string) => {
	const [_, query] = url.split("?");
	mockSearchParams.delete("q");
	mockSearchParams.delete("tags");
	if (query) {
		const params = new URLSearchParams(query);
		for (const [key, value] of params.entries()) {
			mockSearchParams.set(key, value);
		}
	}
});
const mockPush = vi.fn((url: string) => {
	const [_, query] = url.split("?");
	mockSearchParams.delete("q");
	mockSearchParams.delete("tags");
	if (query) {
		const params = new URLSearchParams(query);
		for (const [key, value] of params.entries()) {
			mockSearchParams.set(key, value);
		}
	}
});
let mockPathname = "/notes";
const mockSearchParams = new URLSearchParams();

vi.mock("next/navigation", () => ({
	useRouter: () => ({
		replace: mockReplace,
		push: mockPush,
	}),
	usePathname: () => mockPathname,
	useSearchParams: () => mockSearchParams,
}));

describe("SearchInput Component", () => {
	beforeEach(() => {
		vi.clearAllMocks();
		mockPathname = "/notes";
		mockSearchParams.delete("q");
		mockSearchParams.delete("tags");
	});

	it("should parse keywords and tags to update URL (Debounce check)", async () => {
		const user = userEvent.setup();
		render(<SearchInput />);

		const input = screen.getByPlaceholderText(/Search keywords/i);
		await user.type(input, "#design ui");

		// Wait for debounce (300ms + buffer)
		await waitFor(
			() => {
				expect(mockReplace).toHaveBeenCalledWith("/notes?q=ui&tags=design", {
					scroll: false,
				});
			},
			{ timeout: 1000 },
		);
	});

	it("should use router.push and path correction when not on /notes", async () => {
		mockPathname = "/studio";
		const user = userEvent.setup();
		render(<SearchInput />);

		const input = screen.getByPlaceholderText(/Search keywords/i);
		await user.type(input, "test");

		await waitFor(
			() => {
				expect(mockPush).toHaveBeenCalledWith("/notes?q=test", {
					scroll: false,
				});
				expect(mockReplace).not.toHaveBeenCalled();
			},
			{ timeout: 1000 },
		);
	});

	it("should clear input and URL params when clear button is clicked", async () => {
		const user = userEvent.setup();
		render(<SearchInput />);

		const input = screen.getByPlaceholderText(/Search keywords/i);
		await user.type(input, "test");

		await waitFor(
			() => {
				expect(mockReplace).toHaveBeenCalledWith("/notes?q=test", {
					scroll: false,
				});
			},
			{ timeout: 1000 },
		);

		const clearButton = await screen.findByRole("button", {
			name: /Clear search/i,
		});
		await user.click(clearButton);

		expect(input).toHaveValue("");
		await waitFor(() => {
			expect(mockReplace).toHaveBeenLastCalledWith("/notes?", {
				scroll: false,
			});
		});
	});
});
