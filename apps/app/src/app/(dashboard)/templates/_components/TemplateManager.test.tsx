/** @vitest-environment jsdom */
import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { TemplateManager } from "./TemplateManager";

// next/navigation mock
vi.mock("next/navigation", () => ({
	useRouter: () => ({ push: vi.fn(), refresh: vi.fn() }),
}));

// supabase mock
vi.mock("@/utils/supabase/client", () => ({
	createClient: () => ({
		auth: {
			getUser: vi
				.fn()
				.mockResolvedValue({ data: { user: { id: "u1" } }, error: null }),
		},
		from: vi.fn().mockReturnValue({
			insert: vi.fn().mockReturnValue({
				select: vi.fn().mockReturnValue({
					single: vi.fn().mockResolvedValue({
						data: { id: "new-123", name: "New", user_id: "u1" },
						error: null,
					}),
				}),
			}),
			update: vi.fn().mockReturnValue({
				eq: vi.fn().mockResolvedValue({ error: null }),
			}),
			delete: vi.fn().mockReturnValue({
				eq: vi.fn().mockResolvedValue({ error: null }),
			}),
		}),
	}),
}));

const mockTemplates = [
	{
		id: "1",
		name: "Mock Template",
		max_length: 100,
		boilerplate: "Hello",
		weave_prompt: "Focus on X",
		user_id: "u1",
		icon: null,
		created_at: "",
		updated_at: "",
	},
];

describe("TemplateManager", () => {
	it("renders list and allows selecting a template", async () => {
		render(<TemplateManager initialTemplates={mockTemplates} selectedId="1" />);

		// Check if list item exists
		expect(screen.getByText("Mock Template")).toBeInTheDocument();

		// Check form fields
		expect(screen.getByLabelText("Template Name")).toHaveValue("Mock Template");
		expect(screen.getByLabelText("Max Length (Optional)")).toHaveValue(100);
		expect(
			screen.getByLabelText("Boilerplate / Initial Text (Optional)"),
		).toHaveValue("Hello");
		expect(
			screen.getByLabelText("Weave Prompt (System Prompt for AI) (Optional)"),
		).toHaveValue("Focus on X");
	});

	it("shows empty state when no template is selected", () => {
		render(
			<TemplateManager initialTemplates={mockTemplates} selectedId={null} />,
		);
		expect(
			screen.getByText("Select a template to edit or create a new one."),
		).toBeInTheDocument();
	});

	it("shows creation form when id is 'new'", () => {
		render(
			<TemplateManager initialTemplates={mockTemplates} selectedId="new" />,
		);
		expect(screen.getByText("Create Template")).toBeInTheDocument();
		expect(screen.getByLabelText("Template Name")).toHaveValue("");
	});
});
