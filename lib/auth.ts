import * as SecureStore from 'expo-secure-store';

const KEYS = {
  onboarding: 'ghost_onboarding_done',
  guest: 'ghost_guest_mode',
  userName: 'ghost_user_name',
  userEmail: 'ghost_user_email',
  authenticated: 'ghost_authenticated',
} as const;

export type AuthSession = {
  isGuest: boolean;
  isAuthenticated: boolean;
  hasOnboarded: boolean;
  name: string;
  email: string;
};

export async function getSession(): Promise<AuthSession> {
  const [onb, guest, auth, name, email] = await Promise.all([
    SecureStore.getItemAsync(KEYS.onboarding),
    SecureStore.getItemAsync(KEYS.guest),
    SecureStore.getItemAsync(KEYS.authenticated),
    SecureStore.getItemAsync(KEYS.userName),
    SecureStore.getItemAsync(KEYS.userEmail),
  ]);
  return {
    hasOnboarded: onb === 'true',
    isGuest: guest === 'true',
    isAuthenticated: auth === 'true',
    name: name ?? 'Guest',
    email: email ?? '',
  };
}

export async function completeOnboarding(): Promise<void> {
  await SecureStore.setItemAsync(KEYS.onboarding, 'true');
}

export async function enterAsGuest(): Promise<void> {
  await Promise.all([
    SecureStore.setItemAsync(KEYS.guest, 'true'),
    SecureStore.setItemAsync(KEYS.authenticated, 'false'),
    SecureStore.setItemAsync(KEYS.userName, 'Guest'),
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
  if (!s.hasOnboarded) return '/(auth)/onboarding';
  if (s.isAuthenticated || s.isGuest) return '/(tabs)';
  return '/(auth)/login';
}
