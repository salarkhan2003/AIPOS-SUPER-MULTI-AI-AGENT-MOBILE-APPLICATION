import * as SecureStore from 'expo-secure-store';

const PRO_KEY = 'ghost_pro';

export async function isGhostPro(): Promise<boolean> {
  const v = await SecureStore.getItemAsync(PRO_KEY);
  return v === 'true';
}

export async function setGhostPro(enabled: boolean): Promise<void> {
  await SecureStore.setItemAsync(PRO_KEY, enabled ? 'true' : 'false');
}

export async function canUseAppMesh(): Promise<boolean> {
  return isGhostPro();
}

export async function canCreateUnlimitedWatchdogs(): Promise<boolean> {
  return isGhostPro();
}

/** Razorpay — requires dev build with react-native-razorpay linked */
export async function purchaseGhostPro(): Promise<{ success: boolean; error?: string }> {
  try {
    // Dynamic import avoids crash in Expo Go
    const Razorpay = require('react-native-razorpay').default;
    const options = {
      description: 'Ghost Pro — unlimited watchdogs + App Mesh',
      currency: 'INR',
      key: process.env.EXPO_PUBLIC_RAZORPAY_KEY ?? '',
      amount: 19900,
      name: 'AIPOS Ghost',
      prefill: { email: 'user@ghost.ai', contact: '' },
      theme: { color: '#6B4EFF' },
    };
    const data = await Razorpay.open(options);
    if (data?.razorpay_payment_id) {
      await setGhostPro(true);
      return { success: true };
    }
    return { success: false, error: 'Payment cancelled' };
  } catch (e) {
    // Dev / Expo Go fallback — simulate for testing
    if (__DEV__) {
      await setGhostPro(true);
      return { success: true };
    }
    return { success: false, error: String(e) };
  }
}
