"use client";

import { useActionState, useEffect, useState } from "react";
import { Pencil } from "lucide-react";
import { setWeeklyGoal } from "@/app/dashboard/plan-actions";
import { toast } from "@/components/Toaster";

/** Inline editor for the weekly application goal. */
export function GoalForm({ goal }: { goal: number }) {
  const [editing, setEditing] = useState(false);
  const [state, action, pending] = useActionState(setWeeklyGoal, undefined);

  useEffect(() => {
    if (state?.ok) toast("Weekly goal updated 🎯");
    if (state?.error) toast(state.error, "error");
  }, [state]);

  if (!editing) {
    return (
      <button type="button" onClick={() => setEditing(true)} className="inline-flex items-center gap-1 text-xs font-semibold text-brand hover:underline">
        <Pencil className="size-3" /> Change goal
      </button>
    );
  }
  return (
    <form
      action={(data) => {
        action(data);
        setEditing(false);
      }}
      className="flex items-center gap-2"
    >
      <label className="sr-only" htmlFor="weekly_goal">
        Applications per week
      </label>
      <input
        id="weekly_goal"
        name="weekly_goal"
        type="number"
        min={1}
        max={50}
        defaultValue={goal}
        className="w-16 rounded-lg border border-line bg-surface px-2 py-1 text-sm outline-none focus:border-brand focus:ring-2 focus:ring-brand/15"
      />
      <span className="text-xs text-muted">a week</span>
      <button disabled={pending} className="rounded-lg bg-brand px-2.5 py-1 text-xs font-semibold text-brand-ink disabled:opacity-60">
        {pending ? "…" : "Save"}
      </button>
    </form>
  );
}
