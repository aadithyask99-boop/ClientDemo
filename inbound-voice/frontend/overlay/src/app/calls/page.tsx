"use client";

import { useEffect, useState } from "react";

import { Skeleton } from "@/components/ui/skeleton";

type Call = { id: string; startedAt: string | null; callerNumber: string | null; outcome: string | null; summary: string | null; durationSeconds: number | null };

const OUTCOMES: Record<string, string> = {
    BOOKED: "Booked",
    MESSAGE_TAKEN: "Message taken",
    CALLBACK_REQUESTED: "Callback requested",
    INFO_GIVEN: "Info given",
    OPTED_OUT: "Opted out",
    TRANSFERRED: "Transferred",
    TRANSFER_FAILED: "Transfer failed",
    NO_OUTCOME: "No outcome",
};

const when = (iso: string | null) => (iso ? new Intl.DateTimeFormat("en-GB", { dateStyle: "medium", timeStyle: "short" }).format(new Date(iso)) : "");
const length = (s: number | null) => (s == null ? "" : s >= 60 ? `${Math.floor(s / 60)}m ${s % 60}s` : `${s}s`);

export default function CallsPage() {
    const [calls, setCalls] = useState<Call[] | null>(null);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        fetch("/api/crm/calls")
            .then(async (r) => {
                const b = await r.json();
                if (!r.ok) throw new Error(b.error ?? `Request failed (${r.status})`);
                setCalls(b.calls);
            })
            .catch((e: Error) => setError(e.message));
    }, []);

    if (error) return <div className="p-6"><h1 className="mb-2 text-2xl font-bold">Calls</h1><p className="text-sm text-muted-foreground">Could not load calls: {error}</p></div>;
    if (!calls) return <div className="p-6"><Skeleton className="h-64 w-full" /></div>;

    return <div className="space-y-4 p-4">
        <h1 className="text-2xl font-bold">Calls</h1>
        <div className="overflow-x-auto rounded-md border">
            <table className="w-full text-sm">
                <thead><tr className="border-b text-left text-muted-foreground"><th className="p-2 font-medium">When</th><th className="p-2 font-medium">Caller</th><th className="p-2 font-medium">Outcome</th><th className="p-2 font-medium">Length</th><th className="p-2 font-medium">Summary</th></tr></thead>
                <tbody>
                    {calls.map((c) => (
                        <tr key={c.id} className="border-b align-top last:border-0">
                            <td className="whitespace-nowrap p-2">{when(c.startedAt)}</td>
                            <td className="whitespace-nowrap p-2 tabular-nums">{c.callerNumber}</td>
                            <td className="whitespace-nowrap p-2">{OUTCOMES[c.outcome ?? ""] ?? c.outcome}</td>
                            <td className="whitespace-nowrap p-2">{length(c.durationSeconds)}</td>
                            <td className="p-2">{c.summary}</td>
                        </tr>
                    ))}
                    {calls.length === 0 && <tr><td className="p-4 text-muted-foreground" colSpan={5}>No calls yet.</td></tr>}
                </tbody>
            </table>
        </div>
    </div>;
}
