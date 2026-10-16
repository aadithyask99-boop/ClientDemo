"use client";

import { ExternalLink } from "lucide-react";
import { useState } from "react";

import { Button } from "@/components/ui/button";

// Twenty is a separate app. Set NEXT_PUBLIC_TWENTY_URL at build time to its address as the browser sees it.
const TWENTY_URL = (process.env.NEXT_PUBLIC_TWENTY_URL ?? "http://localhost:2020").replace(/\/$/, "");

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
        <p className="text-xs text-muted-foreground">If this stays blank, the CRM refused to be shown inside this page or needs you to sign in: use the new tab link.</p>
    </div>;
}
