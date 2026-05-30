/**
 * App Mesh — JS bridge to Android AccessibilityService
 * Requires dev build with ghost-accessibility native module.
 */
import { Linking, Platform } from 'react-native';

const PACKAGES: Record<string, string> = {
  uber: 'com.ubercab',
  whatsapp: 'com.whatsapp',
  gmail: 'com.google.android.gm',
  chrome: 'com.android.chrome',
};

type AccessibilityNative = {
  tapByText: (packageName: string, text: string) => Promise<boolean>;
  typeInField: (packageName: string, text: string, value: string) => Promise<boolean>;
  getScreenText: (packageName: string) => Promise<string>;
  isServiceEnabled: () => Promise<boolean>;
  openAccessibilitySettings: () => Promise<void>;
};

const Native: AccessibilityNative | undefined = (() => {
  try {
    const { requireOptionalNativeModule } = require('expo-modules-core') as {
      requireOptionalNativeModule: <T>(name: string) => T | null;
    };
    return requireOptionalNativeModule<AccessibilityNative>('GhostAccessibility') ?? undefined;
  } catch {
    return undefined;
  }
})();

export async function isAccessibilityEnabled(): Promise<boolean> {
  if (Platform.OS !== 'android' || !Native) return false;
  try {
    return await Native.isServiceEnabled();
  } catch {
    return false;
  }
}

export async function openAccessibilitySettings(): Promise<void> {
  if (Native?.openAccessibilitySettings) {
    await Native.openAccessibilitySettings();
    return;
  }
  await Linking.openSettings();
}

export async function deepLink(app: string, params?: Record<string, unknown>): Promise<boolean> {
  const normalized = app.toLowerCase().replace(/cab|ride|taxi/, 'uber');
  const pkg = PACKAGES[normalized] ?? PACKAGES[app.toLowerCase()] ?? app;
  const scheme =
    normalized === 'whatsapp' || app === 'whatsapp'
      ? `whatsapp://send?phone=${params?.phone ?? ''}&text=${encodeURIComponent(String(params?.text ?? ''))}`
      : normalized === 'uber' || app === 'uber'
        ? 'uber://'
        : normalized === 'gmail' || app === 'gmail'
          ? 'googlegmail://'
          : `intent://#Intent;package=${pkg};end`;

  try {
    const can = await Linking.canOpenURL(scheme);
    if (can) {
      await Linking.openURL(scheme);
      return true;
    }
    if (Platform.OS === 'android') {
      await Linking.openURL(`market://details?id=${pkg}`);
    }
    return false;
  } catch (e) {
    console.warn('deepLink failed', e);
    return false;
  }
}

export async function uiTap(app: string, text: string, _xpath?: string): Promise<boolean> {
  const pkg = PACKAGES[app.toLowerCase()] ?? app;
  if (!Native) {
    console.warn('[AppMesh] Native module missing — open dev build. Fallback: deep link only.');
    await deepLink(app);
    return false;
  }
  return Native.tapByText(pkg, text);
}

export async function uiType(app: string, text: string, value: string): Promise<boolean> {
  const pkg = PACKAGES[app.toLowerCase()] ?? app;
  if (!Native) return false;
  return Native.typeInField(pkg, text, value);
}

export async function getScreenText(app: string): Promise<string> {
  const pkg = PACKAGES[app.toLowerCase()] ?? app;
  if (!Native) return '';
  return Native.getScreenText(pkg);
}
