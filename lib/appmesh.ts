/**
 * App Mesh — JS bridge to Android AccessibilityService
 * Requires dev build with ghost-accessibility native module.
 */
import { normalizePhone } from '@/lib/utils';
import { Linking, Platform } from 'react-native';

const PACKAGES: Record<string, string> = {
  uber: 'com.ubercab',
  whatsapp: 'com.whatsapp',
  gmail: 'com.google.android.gm',
  chrome: 'com.android.chrome',
  flipkart: 'com.flipkart.android',
  amazon: 'in.amazon.mShop.android.shopping',
  playstore: 'com.android.vending',
  gallery: 'com.google.android.apps.photos',
  camera: 'com.android.camera',
  settings: 'com.android.settings',
  calculator: 'com.android.calculator2',
  calendar: 'com.google.android.calendar',
  youtube: 'com.google.android.youtube',
  maps: 'com.google.android.apps.maps',
  messages: 'com.google.android.apps.messaging',
  phone: 'com.google.android.dialer',
  spotify: 'com.spotify.music',
  netflix: 'com.netflix.mediaclient',
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

export async function searchOnApp(app: string, query: string): Promise<boolean> {
  const normalized = app.toLowerCase();
  
  if (normalized === 'flipkart') {
    return deepLink(app, { search: query });
  } else if (normalized === 'amazon') {
    return deepLink(app, { search: query });
  } else if (normalized === 'youtube') {
    return deepLink(app, { search: query });
  } else if (normalized === 'chrome') {
    return deepLink(app, { search: query });
  } else {
    await deepLink(app);
    return false;
  }
}

export async function deepLink(app: string, params?: Record<string, unknown>): Promise<boolean> {
  const normalized = app.toLowerCase().replace(/cab|ride|taxi/, 'uber');
  const pkg = PACKAGES[normalized] ?? PACKAGES[app.toLowerCase()] ?? app;
  const waPhone = params?.phone ? normalizePhone(String(params.phone)) : '';
  const searchQuery = params?.search ? encodeURIComponent(String(params.search)) : '';
  
  let scheme = '';
  
  if (normalized === 'whatsapp' || app === 'whatsapp') {
    scheme = `whatsapp://send?phone=${waPhone}&text=${encodeURIComponent(String(params?.text ?? params?.message ?? ''))}`;
  } else if (normalized === 'uber' || app === 'uber') {
    scheme = 'uber://';
  } else if (normalized === 'gmail' || app === 'gmail') {
    scheme = 'googlegmail://';
  } else if (normalized === 'flipkart') {
    scheme = `flipkart://search?q=${searchQuery}`;
  } else if (normalized === 'amazon') {
    scheme = `https://www.amazon.in/s?k=${searchQuery}`;
  } else if (normalized === 'youtube') {
    scheme = `https://www.youtube.com/results?search_query=${searchQuery}`;
  } else if (normalized === 'chrome') {
    scheme = searchQuery ? `https://www.google.com/search?q=${searchQuery}` : 'googlechrome://';
  } else if (normalized === 'playstore') {
    scheme = `market://details?id=${pkg}`;
  } else {
    scheme = `intent://#Intent;package=${pkg};end`;
  }

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
