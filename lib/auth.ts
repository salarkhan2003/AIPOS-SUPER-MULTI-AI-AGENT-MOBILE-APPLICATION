import * as SecureStore from 'expo-secure-store';

const KEYS = {
  onboarding: 'ghost_onboarding_done',
  guest: 'ghost_guest_mode',
  userName: 'ghost_user_name',
  userEmail: 'ghost_user_email',
  userGender: 'ghost_user_gender',
  authenticated: 'ghost_authenticated',
  voiceAiEnabled: 'ghost_voice_ai_enabled',
} as const;

export type AuthSession = {
  isGuest: boolean;
  isAuthenticated: boolean;
  hasOnboarded: boolean;
  name: string;
  email: string;
  gender: string;
  voiceAiEnabled: boolean;
};

export async function getSession(): Promise<AuthSession> {
  const [onb, guest, auth, name, email, gender, voiceEnabled] = await Promise.all([
    SecureStore.getItemAsync(KEYS.onboarding),
    SecureStore.getItemAsync(KEYS.guest),
    SecureStore.getItemAsync(KEYS.authenticated),
    SecureStore.getItemAsync(KEYS.userName),
    SecureStore.getItemAsync(KEYS.userEmail),
    SecureStore.getItemAsync(KEYS.userGender),
    SecureStore.getItemAsync(KEYS.voiceAiEnabled),
  ]);
  const savedName = name?.trim();
  return {
    hasOnboarded: onb === 'true',
    isGuest: guest === 'true',
    isAuthenticated: auth === 'true',
    name: savedName && savedName !== 'Guest' ? savedName : savedName || '',
    email: email ?? '',
    gender: gender ?? '',
    voiceAiEnabled: voiceEnabled !== 'false', // default true
  };
}

/** Complete onboarding with mandatory nickname — grants full app access as guest. */
export async function finishOnboardingWithNickname(nickname: string): Promise<void> {
  const name = nickname.trim();
  if (!name) throw new Error('Nickname is required');
  await Promise.all([
    SecureStore.setItemAsync(KEYS.onboarding, 'true'),
    SecureStore.setItemAsync(KEYS.guest, 'true'),
    SecureStore.setItemAsync(KEYS.authenticated, 'false'),
    SecureStore.setItemAsync(KEYS.userName, name),
    SecureStore.setItemAsync(KEYS.voiceAiEnabled, 'true'),
    SecureStore.deleteItemAsync(KEYS.userEmail),
  ]);
}

export async function setVoiceAiEnabled(enabled: boolean): Promise<void> {
  await SecureStore.setItemAsync(KEYS.voiceAiEnabled, enabled ? 'true' : 'false');
}

export async function completeOnboarding(): Promise<void> {
  await SecureStore.setItemAsync(KEYS.onboarding, 'true');
}

export async function updateUserProfile(patch: { name?: string; gender?: string }): Promise<void> {
  const ops: Promise<void>[] = [];
  if (patch.name !== undefined) {
    const n = patch.name.trim();
    if (!n) throw new Error('Name cannot be empty');
    ops.push(SecureStore.setItemAsync(KEYS.userName, n));
  }
  if (patch.gender !== undefined) {
    if (patch.gender) {
      ops.push(SecureStore.setItemAsync(KEYS.userGender, patch.gender));
    } else {
      ops.push(SecureStore.deleteItemAsync(KEYS.userGender));
    }
  }
  await Promise.all(ops);
}

export async function enterAsGuest(): Promise<void> {
  const session = await getSession();
  const name = session.name?.trim() || 'Guest';
  await Promise.all([
    SecureStore.setItemAsync(KEYS.guest, 'true'),
    SecureStore.setItemAsync(KEYS.authenticated, 'false'),
    SecureStore.setItemAsync(KEYS.userName, name),
    SecureStore.deleteItemAsync(KEYS.userEmail),
  ]);
}

export async function signIn(email: string, name: string): Promise<void> {
  await Promise.all([
    SecureStore.setItemAsync(KEYS.authenticated, 'true'),
    SecureStore.setItemAsync(KEYS.guest, 'false'),
    SecureStore.setItemAsync(KEYS.userEmail, email.trim()),
    SecureStore.setItemAsync(KEYS.userName, name.trim() || email.split('@')[0]),
  ]);
}

export async function createAccount(email: string, name: string): Promise<void> {
  await signIn(email, name);
}

export async function signOut(): Promise<void> {
  await enterAsGuest();
}

export async function getInitialRoute(): Promise<string> {
  const s = await getSession();
  if (!s.hasOnboarded || !s.name?.trim()) return '/(auth)/onboarding';
  return '/(tabs)';
}
