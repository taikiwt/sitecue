import { describe, expect, it } from "vitest";
import { NOTES_LIMIT } from "./limits";

describe("NOTES_LIMIT Constants", () => {
	it("should have correct free plan limit values", () => {
		expect(NOTES_LIMIT.MAX_FREE).toBe(500);
		expect(NOTES_LIMIT.WARNING_THRESHOLD).toBe(450);
	});

	it("warning threshold should be 90% of max limit", () => {
		expect(NOTES_LIMIT.WARNING_THRESHOLD).toBe(NOTES_LIMIT.MAX_FREE * 0.9);
	});
});
