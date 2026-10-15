/**
 * Deterministic checks on a call transcript, used as a safety net where an LLM cannot be trusted to follow instructions.
 * Opt-outs matter legally: a caller who asks not to be contacted again must be flagged even if the agent forgot its tool.
 * The patterns are deliberately specific ("don't call me again", "remove my number from ...") so ordinary requests such as
 * "don't call me before 9" are not treated as opt-outs.
 */
const OPT_OUT_PATTERNS: RegExp[] = [
  /\b(?:do not|don'?t|never|stop)\s+(?:call|contact|text|ring|message|email)(?:ing)?\s+(?:me|us)?\s*(?:again|anymore|any more|ever)\b/i,
  /\bremove\s+(?:me|my\s+(?:number|details|name|contact\s+details))\s+from\b/i,
  /\btake\s+(?:me|my\s+number)\s+off\b/i,
  /\bremove\s+my\s+number\b/i,
  /\bunsubscribe\b/i,
  /\bopt\s*(?:me\s+)?out\b/i,
];

/** Lines the caller said. Transcripts look like `[2026-10-15T15:05:14+00:00] user: text` (the agent is `assistant:`). */
export function callerLines(transcript: string): string[] {
  return transcript
    .split(/\r?\n/)
    .map((l) => /^\s*(?:\[[^\]]*\]\s*)?(?:user|caller|customer)\s*:\s*(.*)$/i.exec(l)?.[1]?.trim())
    .filter((l): l is string => !!l);
}

/** True when the caller clearly asked not to be contacted again. Only the caller's own words count. */
export function detectOptOut(transcript: string): boolean {
  return callerLines(transcript).some((line) => OPT_OUT_PATTERNS.some((re) => re.test(line)));
}
