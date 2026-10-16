"use client";

import { Plus } from "lucide-react";
import { useCallback, useEffect, useState } from "react";

import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";

type Customer = { id: string; name: string; phone: string; email: string };

export default function CustomersPage() {
    const [people, setPeople] = useState<Customer[] | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [adding, setAdding] = useState(false);
    const [filter, setFilter] = useState("");

    const load = useCallback(() => {
        fetch("/api/staff/customers")
            .then(async (r) => {
                const b = await r.json();
                if (!r.ok) throw new Error(b.error ?? `Request failed (${r.status})`);
                setPeople(b.customers);
                setError(null);
            })
            .catch((e: Error) => setError(e.message));
    }, []);
    useEffect(load, [load]);

    if (error) return <div className="p-6"><h1 className="mb-2 text-2xl font-bold">Customers</h1><p className="text-sm text-muted-foreground">Could not load customers: {error}</p></div>;
    if (!people) return <div className="p-6"><Skeleton className="h-64 w-full" /></div>;

    const q = filter.trim().toLowerCase();
    const shown = q ? people.filter((p) => `${p.name} ${p.phone} ${p.email}`.toLowerCase().includes(q)) : people;

    return <div className="space-y-4 p-4">
        <div className="flex flex-wrap items-center gap-2">
            <h1 className="mr-4 text-2xl font-bold">Customers</h1>
            <Input className="w-64" placeholder="Search name, phone or email" value={filter} onChange={(e) => setFilter(e.target.value)} />
            <Button size="sm" className="ml-auto" onClick={() => setAdding(true)}><Plus className="mr-1 h-4 w-4" />Add customer</Button>
        </div>
        <div className="overflow-x-auto rounded-md border">
            <table className="w-full text-sm">
                <thead><tr className="border-b text-left text-muted-foreground"><th className="p-2 font-medium">Name</th><th className="p-2 font-medium">Phone</th><th className="p-2 font-medium">Email</th></tr></thead>
                <tbody>
                    {shown.map((p) => <tr key={p.id} className="border-b last:border-0"><td className="p-2">{p.name || "(no name)"}</td><td className="p-2 tabular-nums">{p.phone}</td><td className="p-2">{p.email}</td></tr>)}
                    {shown.length === 0 && <tr><td className="p-4 text-muted-foreground" colSpan={3}>{q ? "No one matches." : "No customers yet. Callers are added automatically, or add one by hand."}</td></tr>}
                </tbody>
            </table>
        </div>
        {adding && <AddDialog onClose={() => setAdding(false)} onDone={() => { setAdding(false); load(); }} />}
    </div>;
}

function AddDialog({ onClose, onDone }: { onClose: () => void; onDone: () => void }) {
    const [name, setName] = useState("");
    const [phone, setPhone] = useState("");
    const [email, setEmail] = useState("");
    const [busy, setBusy] = useState(false);
    const [err, setErr] = useState<string | null>(null);

    const save = async () => {
        setBusy(true);
        setErr(null);
        const r = await fetch("/api/staff/customers", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ name, phone, email }) });
        const b = await r.json().catch(() => ({}));
        if (r.ok) return onDone();
        setErr(b.message ?? b.error ?? `Request failed (${r.status})`);
        setBusy(false);
    };

    return <Dialog open onOpenChange={(o) => !o && onClose()}>
        <DialogContent>
            <DialogHeader>
                <DialogTitle>Add customer</DialogTitle>
                <DialogDescription>A customer added with a phone number is recognised when they ring.</DialogDescription>
            </DialogHeader>
            <div className="space-y-3">
                <label className="block text-sm">Name<Input value={name} onChange={(e) => setName(e.target.value)} /></label>
                <label className="block text-sm">Phone (UK)<Input value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="07400 123456" /></label>
                <label className="block text-sm">Email (optional)<Input value={email} onChange={(e) => setEmail(e.target.value)} /></label>
                {err && <p className="text-sm text-destructive">{err}</p>}
            </div>
            <DialogFooter>
                <Button variant="outline" onClick={onClose}>Cancel</Button>
                <Button disabled={busy || !name.trim()} onClick={save}>Add</Button>
            </DialogFooter>
        </DialogContent>
    </Dialog>;
}
