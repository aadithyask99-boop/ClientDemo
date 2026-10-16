"use client";

import { ChevronLeft, ChevronRight, Plus } from "lucide-react";
import { useCallback, useEffect, useMemo, useState } from "react";

import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";

type Booking = { uid: string; start: string; name: string; phone?: string; email?: string; reason?: string };
type Config = { timeZone: string; days: number[]; open: string; close: string; slotMinutes: number };
type Slot = { start: string; label: string };

// ---- date helpers: everything is shown in the client's own time zone ----
const ymd = (d: Date, tz: string) => new Intl.DateTimeFormat("en-CA", { timeZone: tz }).format(d);
const parts = (iso: string, tz: string) => {
    const p = Object.fromEntries(new Intl.DateTimeFormat("en-GB", { timeZone: tz, hour: "2-digit", minute: "2-digit", hourCycle: "h23" }).formatToParts(new Date(iso)).map((x) => [x.type, x.value]));
    return { date: ymd(new Date(iso), tz), time: `${p.hour}:${p.minute}` };
};
const addDays = (date: string, n: number) => {
    const d = new Date(`${date}T00:00:00Z`);
    d.setUTCDate(d.getUTCDate() + n);
    return d.toISOString().slice(0, 10);
};
const mondayOf = (date: string) => {
    const dow = new Date(`${date}T00:00:00Z`).getUTCDay(); // 0 = Sunday
    return addDays(date, dow === 0 ? -6 : 1 - dow);
};
const dayLabel = (date: string) => new Intl.DateTimeFormat("en-GB", { timeZone: "UTC", weekday: "short", day: "numeric", month: "short" }).format(new Date(`${date}T00:00:00Z`));
const rowTimes = (c: Config) => {
    const out: string[] = [];
    const toMin = (t: string) => Number(t.slice(0, 2)) * 60 + Number(t.slice(3, 5));
    for (let m = toMin(c.open); m + c.slotMinutes <= toMin(c.close); m += c.slotMinutes) out.push(`${String(Math.floor(m / 60)).padStart(2, "0")}:${String(m % 60).padStart(2, "0")}`);
    return out;
};

async function call(method: "GET" | "POST", path: string, body?: unknown) {
    const res = await fetch(`/api/staff/${path}`, { method, ...(body ? { headers: { "content-type": "application/json" }, body: JSON.stringify(body) } : {}) });
    const json = await res.json().catch(() => ({}));
    if (!res.ok) throw new Error(json.message ?? json.error ?? `Request failed (${res.status})`);
    return json;
}

export default function CalendarPage() {
    const [config, setConfig] = useState<Config | null>(null);
    const [bookings, setBookings] = useState<Booking[]>([]);
    const [error, setError] = useState<string | null>(null);
    const [week, setWeek] = useState<string | null>(null); // Monday, YYYY-MM-DD
    const [adding, setAdding] = useState<{ date: string; time: string } | null>(null);
    const [open, setOpen] = useState<Booking | null>(null);

    const load = useCallback(async (monday: string | null, tzHint?: string) => {
        try {
            const tz = tzHint ?? config?.timeZone ?? "Europe/London";
            const start = monday ?? mondayOf(ymd(new Date(), tz));
            const from = new Date(`${addDays(start, -1)}T00:00:00Z`).toISOString();
            const to = new Date(`${addDays(start, 8)}T00:00:00Z`).toISOString();
            const res = await fetch(`/api/calendar?from=${encodeURIComponent(from)}&to=${encodeURIComponent(to)}`);
            const body = await res.json();
            if (!res.ok) throw new Error(body.error ?? `Request failed (${res.status})`);
            setConfig(body.config);
            setBookings(body.bookings);
            setWeek((w) => w ?? mondayOf(ymd(new Date(), body.config.timeZone)));
            setError(null);
        } catch (e) {
            setError((e as Error).message);
        }
    }, [config]);

    useEffect(() => {
        load(week);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [week]);

    const grid = useMemo(() => {
        if (!config || !week) return null;
        const byCell = new Map<string, Booking>();
        for (const b of bookings) {
            const p = parts(b.start, config.timeZone);
            byCell.set(`${p.date} ${p.time}`, b);
        }
        return { byCell, times: rowTimes(config), dates: Array.from({ length: 7 }, (_, i) => addDays(week, i)) };
    }, [config, week, bookings]);

    if (error) return <div className="p-6"><h1 className="mb-2 text-2xl font-bold">Calendar</h1><p className="text-sm text-muted-foreground">Could not load bookings: {error}</p></div>;
    if (!config || !week || !grid) return <div className="p-6"><Skeleton className="h-64 w-full" /></div>;

    const today = ymd(new Date(), config.timeZone);
    const nowLocal = parts(new Date().toISOString(), config.timeZone);
    const refresh = () => load(week);

    return <div className="space-y-4 p-4">
        <div className="flex flex-wrap items-center gap-2">
            <h1 className="mr-4 text-2xl font-bold">Calendar</h1>
            <Button size="sm" variant="outline" onClick={() => setWeek(addDays(week, -7))}><ChevronLeft className="h-4 w-4" /></Button>
            <Button size="sm" variant="outline" onClick={() => setWeek(mondayOf(today))}>Today</Button>
            <Button size="sm" variant="outline" onClick={() => setWeek(addDays(week, 7))}><ChevronRight className="h-4 w-4" /></Button>
            <span className="ml-2 text-sm text-muted-foreground">{dayLabel(week)} to {dayLabel(addDays(week, 6))} ({config.timeZone})</span>
            <Button size="sm" className="ml-auto" onClick={() => setAdding({ date: today, time: "" })}><Plus className="mr-1 h-4 w-4" />New booking</Button>
        </div>

        <div className="overflow-x-auto rounded-md border">
            <table className="w-full min-w-[760px] table-fixed border-collapse text-sm">
                <thead>
                    <tr>
                        <th className="w-16 border-b p-2" />
                        {grid.dates.map((d) => (
                            <th key={d} className={`border-b border-l p-2 text-left font-medium ${d === today ? "bg-muted" : ""}`}>{dayLabel(d)}</th>
                        ))}
                    </tr>
                </thead>
                <tbody>
                    {grid.times.map((t) => (
                        <tr key={t}>
                            <td className="border-b p-1 text-right align-top text-xs text-muted-foreground tabular-nums">{t}</td>
                            {grid.dates.map((d) => {
                                const b = grid.byCell.get(`${d} ${t}`);
                                const working = config.days.includes(new Date(`${d}T00:00:00Z`).getUTCDay());
                                const past = d < today || (d === today && t < nowLocal.time);
                                return (
                                    <td key={d} className={`h-9 border-b border-l p-0.5 align-top ${working ? "" : "bg-muted/40"}`}>
                                        {b ? (
                                            <button className="w-full truncate rounded bg-primary/15 px-1.5 py-1 text-left text-xs hover:bg-primary/25" onClick={() => setOpen(b)} title={b.reason ?? ""}>{b.name}</button>
                                        ) : working && !past ? (
                                            <button className="h-full w-full rounded text-left text-xs text-transparent hover:bg-muted hover:text-muted-foreground" onClick={() => setAdding({ date: d, time: t })}>+ add</button>
                                        ) : null}
                                    </td>
                                );
                            })}
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>

        {adding && <AddDialog config={config} initial={adding} onClose={() => setAdding(null)} onDone={() => { setAdding(null); refresh(); }} />}
        {open && <BookingDialog config={config} booking={open} onClose={() => setOpen(null)} onDone={() => { setOpen(null); refresh(); }} />}
    </div>;
}

/** Free times for a day, as the receptionist would offer them. */
function useSlots(day: string) {
    const [slots, setSlots] = useState<Slot[] | null>(null);
    const [problem, setProblem] = useState<string | null>(null);
    useEffect(() => {
        setSlots(null);
        setProblem(null);
        if (!/^\d{4}-\d{2}-\d{2}$/.test(day)) return;
        call("GET", `slots?day=${day}`).then((r) => setSlots(r.slots)).catch((e: Error) => setProblem(e.message));
    }, [day]);
    return { slots, problem };
}

function AddDialog({ config, initial, onClose, onDone }: { config: Config; initial: { date: string; time: string }; onClose: () => void; onDone: () => void }) {
    const [day, setDay] = useState(initial.date);
    const { slots, problem } = useSlots(day);
    const [start, setStart] = useState("");
    const [name, setName] = useState("");
    const [phone, setPhone] = useState("");
    const [reason, setReason] = useState("");
    const [busy, setBusy] = useState(false);
    const [err, setErr] = useState<string | null>(null);

    // Preselect the clicked time once the day's free times arrive.
    useEffect(() => {
        if (slots && initial.time && !start) setStart(slots.find((s) => s.start.slice(11, 16) === initial.time)?.start ?? "");
    }, [slots, initial.time, start]);

    const save = async () => {
        setBusy(true);
        setErr(null);
        try {
            await call("POST", "bookings", { start, name, ...(phone ? { phone } : {}), ...(reason ? { reason } : {}) });
            onDone();
        } catch (e) {
            setErr((e as Error).message);
            setBusy(false);
        }
    };

    return <Dialog open onOpenChange={(o) => !o && onClose()}>
        <DialogContent>
            <DialogHeader>
                <DialogTitle>New booking</DialogTitle>
                <DialogDescription>Uses the same opening hours and free times as the phone assistant ({config.timeZone}).</DialogDescription>
            </DialogHeader>
            <div className="space-y-3">
                <label className="block text-sm">Day<Input type="date" value={day} onChange={(e) => { setDay(e.target.value); setStart(""); }} /></label>
                <label className="block text-sm">Time
                    <select className="mt-1 w-full rounded-md border bg-background p-2 text-sm" value={start} onChange={(e) => setStart(e.target.value)}>
                        <option value="">{slots === null ? "Loading..." : slots.length ? "Choose a time" : "Nothing free this day"}</option>
                        {(slots ?? []).map((s) => <option key={s.start} value={s.start}>{s.start.slice(11, 16)}</option>)}
                    </select>
                </label>
                <label className="block text-sm">Name<Input value={name} onChange={(e) => setName(e.target.value)} /></label>
                <label className="block text-sm">Phone (optional)<Input value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="+44..." /></label>
                <label className="block text-sm">What it is for (optional)<Input value={reason} onChange={(e) => setReason(e.target.value)} /></label>
                {(err ?? problem) && <p className="text-sm text-destructive">{err ?? problem}</p>}
            </div>
            <DialogFooter>
                <Button variant="outline" onClick={onClose}>Cancel</Button>
                <Button disabled={busy || !start || !name.trim()} onClick={save}>Book</Button>
            </DialogFooter>
        </DialogContent>
    </Dialog>;
}

function BookingDialog({ config, booking, onClose, onDone }: { config: Config; booking: Booking; onClose: () => void; onDone: () => void }) {
    const p = parts(booking.start, config.timeZone);
    const [moving, setMoving] = useState(false);
    const [day, setDay] = useState(p.date);
    const { slots } = useSlots(moving ? day : "");
    const [start, setStart] = useState("");
    const [busy, setBusy] = useState(false);
    const [err, setErr] = useState<string | null>(null);

    const run = async (path: string, body?: unknown) => {
        setBusy(true);
        setErr(null);
        try {
            await call("POST", `bookings/${booking.uid}/${path}`, body);
            onDone();
        } catch (e) {
            setErr((e as Error).message);
            setBusy(false);
        }
    };

    return <Dialog open onOpenChange={(o) => !o && onClose()}>
        <DialogContent>
            <DialogHeader>
                <DialogTitle>{booking.name}</DialogTitle>
                <DialogDescription>{dayLabel(p.date)} at {p.time}</DialogDescription>
            </DialogHeader>
            <div className="space-y-1 text-sm">
                {booking.phone && <div>Phone: {booking.phone}</div>}
                {booking.email && <div>Email: {booking.email}</div>}
                {booking.reason && <div>For: {booking.reason}</div>}
            </div>
            {moving && <div className="space-y-3">
                <label className="block text-sm">New day<Input type="date" value={day} onChange={(e) => { setDay(e.target.value); setStart(""); }} /></label>
                <label className="block text-sm">New time
                    <select className="mt-1 w-full rounded-md border bg-background p-2 text-sm" value={start} onChange={(e) => setStart(e.target.value)}>
                        <option value="">{slots === null ? "Loading..." : slots.length ? "Choose a time" : "Nothing free this day"}</option>
                        {(slots ?? []).map((s) => <option key={s.start} value={s.start}>{s.start.slice(11, 16)}</option>)}
                    </select>
                </label>
            </div>}
            {err && <p className="text-sm text-destructive">{err}</p>}
            <DialogFooter className="gap-2">
                {!moving ? <>
                    <Button variant="outline" onClick={() => setMoving(true)}>Move</Button>
                    <Button variant="destructive" disabled={busy} onClick={() => { if (window.confirm(`Cancel ${booking.name}'s booking?`)) run("cancel"); }}>Cancel booking</Button>
                </> : <>
                    <Button variant="outline" onClick={() => setMoving(false)}>Back</Button>
                    <Button disabled={busy || !start} onClick={() => run("move", { start })}>Move booking</Button>
                </>}
            </DialogFooter>
        </DialogContent>
    </Dialog>;
}
