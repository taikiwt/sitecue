import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { Button } from "../button";

describe("Button Component - Touch Safe Variants", () => {
	it("should apply hover-safe classes for default variant", () => {
		render(<Button data-testid="test-btn">Click me</Button>);
		const button = screen.getByTestId("test-btn");

		// hover-safe:bg-primary-hover がクラスとして付与されていることを確認
		expect(button.className).toContain("hover-safe:bg-primary-hover");
		// 従来の hover: が含まれていないことを確認
		expect(button.className).not.toMatch(/\bhover:bg-/);
	});

	it("should apply hover-safe classes for destructive variant", () => {
		render(
			<Button variant="destructive" data-testid="test-btn-destructive">
				Delete
			</Button>,
		);
		const button = screen.getByTestId("test-btn-destructive");

		expect(button.className).toContain("hover-safe:bg-destructive/20");
		expect(button.className).toContain("dark:hover-safe:bg-destructive/30");
	});
});
