/**
 * Normalize a phone to WhatsApp Cloud API digits (country code + number, no +).
 * Bare 10-digit US numbers get country code 1. Returns null if unusable.
 */
export function normalizeWhatsAppPhone(
  raw: string,
  defaultCountryCode = "1",
): string | null {
  const digits = String(raw ?? "").replace(/\D/g, "");
  if (!digits) return null;
  if (digits.length === 10) return `${defaultCountryCode}${digits}`;
  if (digits.length === 11 && digits.startsWith("1")) return digits;
  if (digits.length >= 11 && digits.length <= 15) return digits;
  return null;
}

/** Unique E.164-style digit phones from parent_contacts rows. */
export function uniquePhonesFromParentRows(
  rows: Array<{ phone?: string | null }>,
  defaultCountryCode = "1",
): string[] {
  const unique = new Set<string>();
  for (const row of rows) {
    const phone = normalizeWhatsAppPhone(String(row.phone ?? ""), defaultCountryCode);
    if (phone) unique.add(phone);
  }
  return [...unique].sort();
}
