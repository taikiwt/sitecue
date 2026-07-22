import fs from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";
import { SHARED_LIMITS } from "./limits";

describe("Limits & DB Schema / Migration Consistency Test", () => {
  it("SHARED_LIMITS の Pro/Free 上限値と DB の CHECK制約 / トリガーの数値が完全一致すること", () => {
    const migrationPath = path.resolve(
      __dirname,
      "../../../../supabase/migrations/20260722000000_update_content_len_checks.sql",
    );
    const sqlContent = fs.readFileSync(migrationPath, "utf-8");

    // sitecue_notes CHECK制約 (30000)
    const notesCheck = sqlContent.match(/sitecue_notes_content_len_check.*<=?\s*(\d+)/i);
    expect(notesCheck).not.toBeNull();
    if (notesCheck) expect(Number.parseInt(notesCheck[1], 10)).toBe(SHARED_LIMITS.NOTE_LENGTH.PRO);

    // sitecue_diaries CHECK制約 (100000)
    const diariesCheck = sqlContent.match(/sitecue_diaries_content_len_check.*<=?\s*(\d+)/i);
    expect(diariesCheck).not.toBeNull();
    if (diariesCheck) expect(Number.parseInt(diariesCheck[1], 10)).toBe(SHARED_LIMITS.DIARY_LENGTH.PRO);

    // check_note_content_length トリガー内 Free上限 (10000)
    const noteTrigger = sqlContent.match(/char_length\(NEW\.content\)\s*>\s*(\d+)/i);
    expect(noteTrigger).not.toBeNull();
    if (noteTrigger) expect(Number.parseInt(noteTrigger[1], 10)).toBe(SHARED_LIMITS.NOTE_LENGTH.FREE);
  });
});
