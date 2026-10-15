import { parsePhoneNumberFromString, type CountryCode } from "libphonenumber-js";

/** Normalize to E.164, or return null if the number cannot be parsed. Pass the tenant's default region for local-format numbers. */
export function toE164(raw: string, defaultRegion?: CountryCode): string | null {
  const parsed = parsePhoneNumberFromString(raw, defaultRegion);
  return parsed && parsed.isValid() ? parsed.number : null;
}
