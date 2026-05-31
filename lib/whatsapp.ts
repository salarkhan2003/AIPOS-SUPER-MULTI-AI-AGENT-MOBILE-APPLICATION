/**
 * WhatsApp — open with pre-filled message via deep link,
 * then auto-tap Send button via AccessibilityService if available.
 */
import * as appmesh from '@/lib/appmesh';
import { contactsStorage, prefsStorage } from '@/lib/storage';
import { normalizePhone } from '@/lib/utils';

export async function resolveContactPhone(nameOrPhone: string): Promise<string | null> {
  const trimmed = nameOrPhone.trim();
  if (/^\+?[\d\s-]{8,}$/.test(trimmed)) return normalizePhone(trimmed);
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
    return { ok: false, detail: 'Add your WhatsApp number in Settings → Messaging first.' };
  }

  const phone = await resolveContactPhone(recipient);
  if (!phone) {
    return { ok: false, detail: `No contact found for "${recipient}". Add them in Settings → Saved contacts.` };
  }

  // Open WhatsApp with pre-filled message
  const opened = await appmesh.deepLink('whatsapp', { phone, text: message });
  if (!opened) {
    return { ok: false, detail: 'Could not open WhatsApp. Make sure it is installed.' };
  }

  // Try to auto-tap Send via AccessibilityService
  const accessOk = await appmesh.isAccessibilityEnabled();
  if (accessOk) {
    // Wait for WhatsApp to load the chat
    await new Promise((r) => setTimeout(r, 2200));
    // Tap the Send button (WhatsApp uses content-desc "Send" on the send button)
    const tapped = await appmesh.uiTap('whatsapp', 'Send');
    if (tapped) {
      return { ok: true, detail: `Message sent to ${recipient} via WhatsApp.` };
    }
    return { ok: true, detail: `WhatsApp opened. Tap Send to deliver the message.` };
  }

  return {
    ok: true,
    detail: `WhatsApp opened with message pre-filled. Tap Send to deliver. Enable Accessibility Service in Settings for auto-send.`,
  };
}
