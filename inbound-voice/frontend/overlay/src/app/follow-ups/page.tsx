"use client";

import { useCallback, useEffect, useState } from "react";

import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";

type Task = { id: string; title: string; status: string; dueAt: string | null; body: string; urgent: boolean };

const when = (iso: string | null) => (iso ? new Intl.DateTimeFormat("en-GB", { dateStyle: "medium", timeStyle: "short" }).format(new Date(iso)) : "");

export default function FollowUpsPage() {
    const [tasks, setTasks] = useState<Task[] | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [showDone, setShowDone] = useState(false);
    const [busy, setBusy] = useState<string | null>(null);

    const load = useCallback(() => {
        fetch("/api/staff/follow-ups?include=done")
            .then(async (r) => {
                const b = await r.json();
                if (!r.ok) throw new Error(b.error ?? `Request failed (${r.status})`);
                setTasks(b.followUps);
                setError(null);
            })
            .catch((e: Error) => setError(e.message));
    }, []);
    useEffect(load, [load]);

    const markDone = async (id: string) => {
        setBusy(id);
        await fetch(`/api/staff/follow-ups/${id}/done`, { method: "POST" });
        setBusy(null);
        load();
    };

    if (error) return <div className="p-6"><h1 className="mb-2 text-2xl font-bold">Follow-ups</h1><p className="text-sm text-muted-foreground">Could not load follow-ups: {error}</p></div>;
    if (!tasks) return <div className="p-6"><Skeleton className="h-64 w-full" /></div>;

    const open = tasks.filter((t) => t.status !== "done");
    const shown = showDone ? tasks : open;

    return <div className="space-y-4 p-4">
        <div className="flex flex-wrap items-center gap-2">
            <h1 className="mr-4 text-2xl font-bold">Follow-ups</h1>
            <span className="text-sm text-muted-foreground">{open.length} to do</span>
            <label className="ml-auto flex items-center gap-2 text-sm"><input type="checkbox" checked={showDone} onChange={(e) => setShowDone(e.target.checked)} />Show done</label>
        </div>
        <ul className="divide-y rounded-md border">
            {shown.map((t) => (
                <li key={t.id} className="flex flex-wrap items-start justify-between gap-3 p-3">
                    <div className="min-w-0 flex-1">
                        <div className={`font-medium ${t.status === "done" ? "text-muted-foreground line-through" : ""}`}>{t.title}</div>
                        {t.body && <div className="mt-1 whitespace-pre-line text-sm text-muted-foreground">{t.body}</div>}
                        {t.dueAt && <div className="mt-1 text-xs text-muted-foreground">Due {when(t.dueAt)}</div>}
                    </div>
                    {t.status !== "done" && <Button size="sm" variant="outline" disabled={busy === t.id} onClick={() => markDone(t.id)}>Mark done</Button>}
                </li>
            ))}
            {shown.length === 0 && <li className="p-4 text-sm text-muted-foreground">Nothing waiting. Messages and callback requests from calls appear here.</li>}
        </ul>
    </div>;
}
