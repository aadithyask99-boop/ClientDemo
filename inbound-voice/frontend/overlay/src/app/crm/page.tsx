"use client";

import { ExternalLink } from "lucide-react";
import { useState } from "react";

import { Button } from "@/components/ui/button";

// Address of the Twenty gateway (frontend/twenty-gateway), which signs the visitor in and allows framing.
// Set NEXT_PUBLIC_TWENTY_URL at build time. Point it at the gateway, never at Twenty directly.
const TWENTY_URL = (process.env.NEXT_PUBLIC_TWENTY_URL ?? "http://localhost:2021").replace(/\/$/, "");

const VIEWS = [
    { label: "Calls", path: "/objects/calls" },
    { label: "Tasks", path: "/objects/tasks" },
    { label: "People", path: "/objects/people" },
];

export default function CrmPage() {
    const [path, setPath] = useState(VIEWS[0].path);

    return <div className="flex h-[calc(100vh-2rem)] flex-col gap-3 p-4">
        <div className="flex flex-wrap items-center gap-2">
            <h1 className="mr-4 text-2xl font-bold">CRM</h1>
            {VIEWS.map((v) => (
                <Button key={v.path} size="sm" variant={v.path === path ? "default" : "outline"} onClick={() => setPath(v.path)}>{v.label}</Button>
            ))}
            <Button asChild size="sm" variant="ghost" className="ml-auto">
                <a href={`${TWENTY_URL}${path}`} target="_blank" rel="noreferrer"><ExternalLink className="mr-1 h-4 w-4" />Open in a new tab</a>
            </Button>
        </div>
        <iframe key={path} title="CRM" src={`${TWENTY_URL}${path}`} className="w-full flex-1 rounded-md border" />
    </div>;
}
