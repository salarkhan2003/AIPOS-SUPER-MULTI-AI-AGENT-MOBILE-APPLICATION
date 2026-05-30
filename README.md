# AIPOS / Ghost — Production AI Personal Operating System

Android-first multi-agent assistant with **real Groq API**, **SQLite memory**, **App Mesh** (AccessibilityService), **background watchdogs**, **voice STT/TTS**, and **WebView browser automation**.

## Setup

```bash
cd aipos
cp .env.example .env   # add EXPO_PUBLIC_GROQ_API_KEY
npm install
```

## Test orchestrator (no device)

```bash
npm run test:ghost -- "book cab"
```

## Run on device (required for App Mesh + background tasks)

Expo Go **cannot** load custom native modules. Use a dev build:

```bash
npx expo prebuild --platform android
npx expo run:android
# or
npx expo start --dev-client
```

1. **Permissions** → enable Accessibility for Ghost App Mesh  
2. **Home** → run "Text Mom" or "Book cab"  
3. **Voice** → tap MIC, say "Hey Ghost, text Mom I'm reaching in 10 min"  
4. **Workflows** → add train 12712 watchdog; wait for notification (15 min interval)  
5. **Memory** → add "Aadhar number …" and search  

## Architecture

| Module | Path |
|--------|------|
| Orchestrator (Groq) | `lib/orchestrator.ts` |
| App Mesh | `lib/appmesh.ts` + `native/GhostAccessibility/` |
| Memory | `lib/memory.ts` |
| Watchdogs | `lib/watchdogs.ts` |
| Voice | `lib/voice.ts` |
| Browser | `lib/browser.ts` |

## Section 2 (Clay UI)

Clay Skia components live in `components/clay/`. Apply after Section 1 device tests pass.

## Security

Never commit `.env`. Rotate any API key that was shared in chat.
