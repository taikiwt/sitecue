/** @vitest-environment jsdom */
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { SaveAsTemplateDialog } from "./SaveAsTemplateDialog";

vi.mock("@/utils/supabase/client", () => ({
	createClient: () => ({
		auth: {
			getUser: vi
				.fn()
				.mockResolvedValue({ data: { user: { id: "test-user" } } }),
		},
		from: vi.fn().mockReturnValue({
			insert: vi.fn().mockReturnValue({
				select: vi.fn().mockReturnValue({
					single: vi.fn().mockResolvedValue({
						data: { id: "tpl-1", name: "New Tpl" },
						error: null,
					}),
				}),
			}),
		}),
	}),
}));

describe("SaveAsTemplateDialog", () => {
	it("renders with initial values and calls onSuccess when saved", async () => {
		const onSuccessMock = vi.fn();
		const user = userEvent.setup();

		render(
			<SaveAsTemplateDialog
				isOpen={true}
				onOpenChange={vi.fn()}
				initialTitle="My Draft"
				initialContent="# Hello"
				onSuccess={onSuccessMock}
			/>,
		);

		// Check initial values
		expect(screen.getByDisplayValue("My Draft Template")).toBeInTheDocument();
		expect(screen.getByDisplayValue("# Hello")).toBeInTheDocument();

		// Click save
		const saveButton = screen.getByRole("button", { name: "Save Template" });
		await user.click(saveButton);

		expect(onSuccessMock).toHaveBeenCalledWith({
			id: "tpl-1",
			name: "New Tpl",
		});
	});
});
