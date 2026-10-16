"use client";

import { ExternalLink } from "lucide-react";

import { PageLayout, PageSection } from "@/components/layout/PageLayout";
import { Button } from "@/components/ui/button";

// Twenty is a separate app and does not allow being shown inside another page, so each view opens in a new tab.
// Set NEXT_PUBLIC_TWENTY_URL at build time to its address as the browser sees it.
const TWENTY_URL = (process.env.NEXT_PUBLIC_TWENTY_URL ?? "http://localhost:2020").replace(/\/$/, "");

const VIEWS = [
    { label: "Calls", path: "/objects/calls", note: "Every call with its outcome and summary." },
    { label: "Tasks", path: "/objects/tasks", note: "Follow-ups from messages and callback requests." },
    { label: "People", path: "/objects/people", note: "Callers, matched by phone number." },
];

export default function CrmPage() {
    return <PageLayout title="CRM" description="Calls, follow-up tasks and people live in the CRM.">
        <PageSection title="Open the CRM" description="Opens in a new tab. Sign in there if asked.">
            <ul className="divide-y">
                {VIEWS.map((v) => (
                    <li key={v.path} className="flex flex-wrap items-center justify-between gap-3 py-3">
                        <div>
                            <div className="font-medium">{v.label}</div>
                            <div className="text-sm text-muted-foreground">{v.note}</div>
                        </div>
                        <Button asChild size="sm" variant="outline">
                            <a href={`${TWENTY_URL}${v.path}`} target="_blank" rel="noreferrer"><ExternalLink className="mr-1 h-4 w-4" />Open {v.label}</a>
                        </Button>
                    </li>
                ))}
            </ul>
        </PageSection>
    </PageLayout>;
}
