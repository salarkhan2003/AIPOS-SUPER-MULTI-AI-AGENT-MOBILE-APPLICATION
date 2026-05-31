export function normalizePhone(raw: string, defaultCountry = '91'): string {
  const digits = raw.replace(/\D/g, '');
  if (digits.length <= 10) return `${defaultCountry}${digits}`;
  return digits;
}
