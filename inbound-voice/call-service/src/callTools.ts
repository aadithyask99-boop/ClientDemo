import { z } from "zod";
import type { CallFactStore } from "./facts.js";
import type { Tenant } from "./types.js";

/** Input of the `take_message` tool: the caller wants to leave a message for staff. */
export const messageInput = z.object({
  message: z.string().min(1),
  name: z.string().optional(),
  callback_number: z.string().optional(),
  urgent: z.union([z.boolean(), z.string()]).optional(),
  workflow_run_id: z.union([z.string(), z.number()]).transform(String).optional(),
});

/**
 * Input of the `record_outcome` tool. Only outcomes that have no tool of their own are accepted here: a booking is
 * recorded by book_appointment and a message by take_message, so the agent cannot claim those without doing them.
 */
export const outcomeInput = z.object({
  outcome: z.enum(["callback_requested", "opted_out", "info_given", "no_outcome"]),
  note: z.string().optional(),
  workflow_run_id: z.union([z.string(), z.number()]).transform(String).optional(),
});

export async function takeMessage(facts: CallFactStore, tenant: Tenant, input: z.infer<typeof messageInput>) {
  const body = input.name ? `${input.name}: ${input.message}` : input.message;
  if (input.workflow_run_id) {
    await facts.record(tenant.id, `dograh:${input.workflow_run_id}`, {
      message: {
        body,
        ...(input.callback_number ? { callbackNumber: input.callback_number } : {}),
        urgent: input.urgent === true || input.urgent === "true",
        ...(input.name ? { name: input.name } : {}),
      },
    });
  }
  return { recorded: true, message: "The message has been passed to the team." };
}

export async function recordOutcome(facts: CallFactStore, tenant: Tenant, input: z.infer<typeof outcomeInput>) {
  if (input.workflow_run_id) {
    await facts.record(tenant.id, `dograh:${input.workflow_run_id}`, {
      outcome: { code: input.outcome.toUpperCase() as "CALLBACK_REQUESTED" | "OPTED_OUT" | "INFO_GIVEN" | "NO_OUTCOME", ...(input.note ? { note: input.note } : {}) },
    });
  }
  return { recorded: true };
}
