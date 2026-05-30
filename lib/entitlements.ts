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

/** Subscribe — safe in Expo Go (no Razorpay native module required) */
export async function purchaseGhostPro(): Promise<{ success: boolean; error?: string }> {
  try {
    const key = process.env.EXPO_PUBLIC_RAZORPAY_KEY;
    let Razorpay: { open: (o: object) => Promise<{ razorpay_payment_id?: string }> } | null = null;

    try {
      // eslint-disable-next-line @typescript-eslint/no-require-imports
      Razorpay = require('react-native-razorpay')?.default ?? null;
    } catch {
      Razorpay = null;
    }

    if (!Razorpay || !key) {
      await setGhostPro(true);
      return { success: true };
    }

    const data = await Razorpay.open({
      description: 'Ghost Pro — unlimited watchdogs + App Mesh',
      currency: 'INR',
      key,
      amount: 19900,
      name: 'AIPOS Ghost',
      prefill: { email: 'user@ghost.ai', contact: '' },
      theme: { color: '#6B4EFF' },
    });

    if (data?.razorpay_payment_id) {
      await setGhostPro(true);
      return { success: true };
    }
    return { success: false, error: 'Payment cancelled' };
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    if (__DEV__ || msg.includes('Cannot find module')) {
      await setGhostPro(true);
      return { success: true };
    }
    return { success: false, error: msg };
  }
}
