import { requireUser } from "@/utils/supabase/server";
import { Activity } from "lucide-react";
import { NOTES_LIMIT } from "@/constants/limits";
import { ComingSoonButton } from "./ComingSoonButton";

export async function StatsOverviewSection() {
    const { supabase } = await requireUser("/");
    const [
        { count: notesCount },
        { count: draftsCount },
    ] = await Promise.all([
        supabase.from("sitecue_notes").select("*", { count: "exact", head: true }),
        supabase.from("sitecue_drafts").select("*", { count: "exact", head: true }),
    ]);

    return (
        <div>
            <div className="mb-4 md:mb-8 flex items-center gap-2">
                <Activity
                    className="w-5 h-5 text-neutral-400"
                    aria-hidden="true"
                />
                <h1 className="text-xl font-light text-action tracking-tight">
                    Overview
                </h1>
            </div>

            {notesCount !== null &&
                notesCount >= NOTES_LIMIT.WARNING_THRESHOLD && (
                    <div className="mb-8 rounded-xl border border-amber-200 bg-amber-50 p-4 flex items-center justify-between">
                        <div className="flex items-center gap-2 text-amber-800">
                            <Activity className="w-4 h-4" aria-hidden="true" />
                            <span className="text-sm font-medium">
                                Note storage almost full ({notesCount}/
                                {NOTES_LIMIT.MAX_FREE}). Upgrade to unlock unlimited
                                notes.
                            </span>
                        </div>
                        <ComingSoonButton
                            text="Upgrade"
                            className="text-xs font-bold text-amber-900 hover:text-amber-700 underline underline-offset-2 cursor-pointer"
                        />
                    </div>
                )}
            <div className="flex flex-col gap-4 text-sm text-neutral-500">
                <div className="flex items-center justify-between border-b border-base-border pb-2">
                    <span className="font-semibold text-neutral-400 uppercase tracking-widest text-[10px]">
                        Total Notes
                    </span>
                    <span className="text-xl font-light text-action">
                        {notesCount || 0}
                    </span>
                </div>
                <div className="flex items-center justify-between border-b border-base-border pb-2">
                    <span className="font-semibold text-neutral-400 uppercase tracking-widest text-[10px]">
                        Total Drafts
                    </span>
                    <span className="text-xl font-light text-action">
                        {draftsCount || 0}
                    </span>
                </div>
            </div>
        </div>
    );
}
