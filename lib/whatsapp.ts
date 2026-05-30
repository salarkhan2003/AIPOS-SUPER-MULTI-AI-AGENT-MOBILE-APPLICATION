import * as appmesh from '@/lib/appmesh';
import { contactsStorage, prefsStorage } from '@/lib/storage';

/** Normalize phone for WhatsApp deep link (digits only, with country code). */
export function normalizePhone(raw: string, defaultCountry = '91'): string {
  const digits = raw.replace(/\D/g, '');
  if (digits.length <= 10) return `${defaultCountry}${digits}`;
  return digits;
}

export async function resolveContactPhone(nameOrPhone: string): Promise<string | null> {
  const trimmed = nameOrPhone.trim();
  if (/^\+?[\d\s-]{8,}$/.test(trimmed)) {
    return normalizePhone(trimmed);
  }
  const contacts = await contactsStorage.list();
  const lower = trimmed.toLowerCase();
  const hit =
    contacts.find((c) => c.name.toLowerCase() === lower) ??
    contacts.find((c) => c.name.toLowerCase().includes(lower));
  return hit ? normalizePhone(hit.phone) : null;
}

export async function sendWhatsAppMessage(
  recipient: string,
  message: string,
): Promise<{ ok: boolean; detail: string }> {
  const prefs = await prefsStorage.get();
  if (!prefs.whatsappNumber?.trim()) {
    return {
      ok: false,
      detail: 'Add your WhatsApp number in Settings → Messaging first.',
    };
  }

  const phone = await resolveContactPhone(recipient);
  if (!phone) {
    return {
      ok: false,
      detail: `No contact found for "${recipient}". Add them in Settings → Saved contacts.`,
    };
  }

  const ok = await appmesh.deepLink('whatsapp', { phone, text: message });
  return ok
    ? { ok: true, detail: `Opened WhatsApp to send to ${recipient}.` }
    : { ok: false, detail: 'Could not open WhatsApp. Install it and try again.' };
}
