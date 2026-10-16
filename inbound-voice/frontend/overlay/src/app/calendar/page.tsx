"use client";

import { useEffect, useState } from "react";

import { PageLayout, PageSection } from "@/components/layout/PageLayout";
import { Skeleton } from "@/components/ui/skeleton";

type Booking = { uid: string; start: string; name: string; phone?: string; email?: string; reason?: string };
type Result = { timeZone: string; bookings: Booking[] };

export default function CalendarPage() {
    const [data, setData] = useState<Result | null>(null);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        fetch("/api/calendar")
            .then(async (res) => {
                const body = await res.json();
                if (!res.ok) throw new Error(body.error ?? `Request failed (${res.status})`);
                setData(body as Result);
            })
            .catch((e: Error) => setError(e.message));
    }, []);

    if (error) {
        return <PageLayout title="Calendar" description="Appointments the receptionist has booked.">
            <PageSection title="Could not load bookings"><p className="text-sm text-muted-foreground">{error}</p></PageSection>
        </PageLayout>;
    }

    if (!data) {
        return <PageLayout title="Calendar"><Skeleton className="h-48 w-full" /></PageLayout>;
    }

    const day = new Intl.DateTimeFormat("en-GB", { timeZone: data.timeZone, weekday: "long", day: "numeric", month: "long", year: "numeric" });
    const time = new Intl.DateTimeFormat("en-GB", { timeZone: data.timeZone, hour: "2-digit", minute: "2-digit" });
    const days = new Map<string, Booking[]>();
    for (const b of data.bookings) {
        const key = day.format(new Date(b.start));
        days.set(key, [...(days.get(key) ?? []), b]);
    }

    return <PageLayout title="Calendar" description={`Upcoming appointments for the next 90 days, in ${data.timeZone} time.`}>
        {days.size === 0 && <PageSection title="Nothing booked"><p className="text-sm text-muted-foreground">New appointments made on calls appear here.</p></PageSection>}
        {[...days].map(([label, items]) => (
            <PageSection key={label} title={label}>
                <ul className="divide-y">
                    {items.map((b) => (
                        <li key={b.uid} className="flex flex-wrap gap-x-6 gap-y-1 py-2">
                            <span className="w-14 font-medium tabular-nums">{time.format(new Date(b.start))}</span>
                            <span className="min-w-32">{b.name}</span>
                            <span className="text-muted-foreground">{[b.phone, b.reason].filter(Boolean).join(" · ")}</span>
                        </li>
                    ))}
                </ul>
            </PageSection>
        ))}
    </PageLayout>;
}
