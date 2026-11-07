export const STATUSES = ["saved", "applied", "interview", "offer", "rejected"] as const;
export type Status = (typeof STATUSES)[number];

export type Application = {
  id: string;
  company: string;
  position: string;
  status: Status;
  location: string | null;
  salary_range: string | null;
  job_url: string | null;
  notes: string | null;
  job_description: string | null;
  applied_at: string | null;
  created_at: string;
  updated_at: string;
};

export const STATUS_META: Record<Status, { label: string; hint: string; dot: string; ring: string }> = {
  saved: { label: "Saved", hint: "Jobs you want to apply to", dot: "bg-slate-400", ring: "ring-slate-400/40" },
  applied: { label: "Applied", hint: "Waiting to hear back", dot: "bg-sky-500", ring: "ring-sky-500/40" },
  interview: { label: "Interview", hint: "In the interview process", dot: "bg-amber-500", ring: "ring-amber-500/40" },
  offer: { label: "Offer", hint: "Offers on the table", dot: "bg-emerald-500", ring: "ring-emerald-500/40" },
  rejected: { label: "Rejected", hint: "Closed — learn and move on", dot: "bg-rose-500", ring: "ring-rose-500/40" },
};

export function isStatus(value: unknown): value is Status {
  return typeof value === "string" && (STATUSES as readonly string[]).includes(value);
}

export function computeStats(apps: Application[]) {
  const count = (s: Status) => apps.filter((a) => a.status === s).length;
  const sent = apps.filter((a) => a.status !== "saved").length;
  const responses = count("interview") + count("offer") + count("rejected");
  return {
    total: apps.length,
    sent,
    interviews: count("interview") + count("offer"),
    offers: count("offer"),
    responseRate: sent === 0 ? 0 : Math.round((responses / sent) * 100),
  };
}

export type Contact = {
  id: string;
  application_id: string;
  name: string;
  role: string | null;
  email: string | null;
  phone: string | null;
  linkedin: string | null;
  notes: string | null;
};

export type HistoryEntry = { id: string; application_id: string; from_status: Status | null; to_status: Status; created_at: string };
