import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { useMediaQuery } from "@/hooks/use-media-query";
import { TemplateManager } from "./TemplateManager";

// useMediaQuery mock
vi.mock("@/hooks/use-media-query", () => ({
	useMediaQuery: vi.fn(),
}));

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

const renderWithQuery = (ui: React.ReactNode) => {
	const queryClient = new QueryClient({
		defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
	});
	return render(
		<QueryClientProvider client={queryClient}>{ui}</QueryClientProvider>,
	);
};

describe("TemplateManager", () => {
	it("renders split pane on desktop and allows selecting a template", async () => {
		vi.mocked(useMediaQuery).mockReturnValue(true);

		renderWithQuery(
			<TemplateManager initialTemplates={mockTemplates} selectedId="1" />,
		);

		// Check if list item exists
		expect(await screen.findByText("Mock Template")).toBeInTheDocument();

		// Check form fields in the desktop pane
		expect(screen.getByLabelText("Template Name")).toHaveValue("Mock Template");
		expect(screen.getByLabelText("Max Length (Optional)")).toHaveValue(100);

		// Drawer should NOT be present (searching for dialog role)
		expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
	});

	it("renders Drawer on mobile when a template is selected", async () => {
		vi.mocked(useMediaQuery).mockReturnValue(false);

		renderWithQuery(
			<TemplateManager initialTemplates={mockTemplates} selectedId="1" />,
		);

		// List item should still be there
		expect(await screen.findByText("Mock Template")).toBeInTheDocument();

		// Drawer should be open (contains dialog role)
		expect(await screen.findByRole("dialog")).toBeInTheDocument();

		// Drawer内の戻るボタンがレンダリングされていることを確認
		const backButton = screen.getByRole("button", { name: /Templates/i });
		expect(backButton).toBeInTheDocument();

		const headings = screen.getAllByText(/Edit Template/i);
		expect(headings.length).toBeGreaterThan(0);
	});

	it("shows empty state when no template is selected (Desktop)", () => {
		vi.mocked(useMediaQuery).mockReturnValue(true);

		renderWithQuery(
			<TemplateManager initialTemplates={mockTemplates} selectedId={null} />,
		);
		expect(
			screen.getByText("Select a template to edit or create a new one."),
		).toBeInTheDocument();
	});

	it("shows creation form on mobile via Drawer", async () => {
		vi.mocked(useMediaQuery).mockReturnValue(false);

		renderWithQuery(
			<TemplateManager initialTemplates={mockTemplates} selectedId="new" />,
		);

		expect(await screen.findByRole("dialog")).toBeInTheDocument();
		const headings = screen.getAllByText(/Create Template/i);
		expect(headings.length).toBeGreaterThan(0);
		expect(screen.getByLabelText("Template Name")).toHaveValue("");
	});

	it("has a new template button in the header", () => {
		vi.mocked(useMediaQuery).mockReturnValue(true);

		renderWithQuery(
			<TemplateManager initialTemplates={mockTemplates} selectedId={null} />,
		);

		const newBtn = screen.getByLabelText("New Template");
		expect(newBtn).toBeInTheDocument();
		expect(newBtn.closest("a")).toHaveAttribute("href", "/templates?id=new");
	});
});
