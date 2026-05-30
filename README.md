# Ghost AI (AIPOS) — Personal AI Operating System

Android-first multi-agent assistant with **Groq API**, **SQLite memory**, **App Mesh** (AccessibilityService), **background watchdogs**, **voice STT/TTS**, **themed notifications**, **WhatsApp messaging**, **calendar**, and **light/dark themes**.

## Quick start

```bash
cd aipos
cp .env.example .env   # add EXPO_PUBLIC_GROQ_API_KEY
npm install
```

### Test orchestrator (no device)

```bash
npm run test:ghost -- "text Mom I'm on my way"
```

### Run on device or APK (required for notifications + App Mesh)

Expo Go **cannot** load custom native modules. Use a dev or release build:

```bash
npx expo prebuild --platform android
npx expo run:android
# Production APK
eas build --platform android --profile preview
```

On first launch, allow **notifications** when prompted (required on Android 13+).

## Features

| Feature | How to use |
|---------|------------|
| **Human-readable UI** | Agent/tool output is formatted — no raw JSON in Neural Log, Tasks, Memory, etc. |
| **Neural Log** | More → Neural Log — live agent thoughts with fixed layout |
| **Notifications** | Settings → test notification; branded channels (violet/coral/mint/yellow) |
| **WhatsApp** | Settings → your WhatsApp number + saved contacts (e.g. Mom). Say *"text Mom I'm on my way"* from Home/Voice |
| **Dark mode** | Settings → Theme: Light / Dark / System — colorful accents preserved |
| **Calendar** | More → Calendar — add events locally, set reminders |
| **Watchdogs** | Workflows screen — background alerts every 15 min (dev build) |

## Setup checklist

1. **Settings** → save your **WhatsApp number**
2. **Settings** → add contacts (name + phone, e.g. Mom → `9876543210`)
3. **Permissions** → enable Accessibility for App Mesh (optional, for UI automation)
4. **Home / Voice** → *"Hey Ghost, text Mom I'm reaching in 10 min"*
5. **Settings** → send test notification to verify APK notifications

## Architecture

| Module | Path |
|--------|------|
| Orchestrator (Groq) | `lib/orchestrator.ts` |
| Display text (no JSON UI) | `lib/displayText.ts` |
| Theme (light/dark) | `lib/themeContext.tsx` |
| WhatsApp + contacts | `lib/whatsapp.ts`, `lib/storage.ts` |
| Notifications | `lib/notifications-local.ts` |
| App Mesh | `lib/appmesh.ts` + `native/GhostAccessibility/` |
| Memory | `lib/memory.ts` |
| Watchdogs | `lib/watchdogs.ts` |
| Voice | `lib/voice.ts` |

## Building APK with notifications

1. `eas build --platform android` (or `expo run:android --variant release`)
2. Install APK on device
3. Open app → allow notifications
4. Settings → **Send test notification**

Notifications use `expo-notifications` with Android channels (`ghost-default`, `ghost-watchdogs`, `ghost-briefing`, `ghost-tasks`) and accent colors matching the app theme.

## Security

Never commit `.env`. Rotate any API key that was shared in chat.
