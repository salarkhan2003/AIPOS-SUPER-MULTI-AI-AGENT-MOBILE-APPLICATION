import { ClayButton, ClayInput } from '@/components/clay';
import { Icon } from '@/components/Icon';
import { L } from '@/constants/light';
import { enterAsGuest, signIn } from '@/lib/auth';
import { useGhostStore } from '@/store/ghostStore';
import { router } from 'expo-router';
import { useState } from 'react';
import { Pressable, ScrollView, StatusBar, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

export default function LoginScreen() {
  const insets = useSafeAreaInsets();
  const setAuth = useGhostStore((s) => s.setAuth);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const goApp = () => router.replace('/(tabs)');

  const onGuest = async () => {
    setLoading(true);
    setError('');
    try {
      await enterAsGuest();
      setAuth({ isGuest: true, isAuthenticated: false, name: 'Guest', email: '' });
      goApp();
    } catch (e) {
      setError(String(e));
    } finally {
      setLoading(false);
    }
  };

  const onSignIn = async () => {
    if (!email.trim()) { setError('Enter your email'); return; }
    setLoading(true);
    setError('');
    try {
      await signIn(email, name || email.split('@')[0]);
      setAuth({ isGuest: false, isAuthenticated: true, email: email.trim(), name: name.trim() || email.split('@')[0] });
      goApp();
    } catch (e) {
      setError(String(e));
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={[styles.root, { paddingTop: insets.top }]}>
      <StatusBar barStyle="dark-content" />
      <ScrollView contentContainerStyle={[styles.scroll, { paddingBottom: insets.bottom + 32 }]} showsVerticalScrollIndicator={false}>

        {/* Hero */}
        <View style={styles.hero}>
          <View style={styles.logoCircle}>
            <Icon name="sparkles" size={32} color="#fff" />
          </View>
          <Text style={styles.logoText}>GHOST</Text>
          <Text style={styles.tagline}>AI Personal Operating System</Text>
        </View>

        {/* Form card */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Sign in</Text>
          <ClayInput label="Email" value={email} onChangeText={setEmail} keyboardType="email-address" autoCapitalize="none" placeholder="you@email.com" />
          <ClayInput label="Display name (optional)" value={name} onChangeText={setName} placeholder="Your name" />
          <ClayInput label="Password" value={password} onChangeText={setPassword} secureTextEntry placeholder="••••••••" />
          {error ? <Text style={styles.err}>{error}</Text> : null}
          <ClayButton label="Sign in" onPress={onSignIn} loading={loading} />
        </View>

        <View style={styles.dividerRow}>
          <View style={styles.divider} />
          <Text style={styles.dividerText}>or</Text>
          <View style={styles.divider} />
        </View>

        {/* Guest */}
        <Pressable style={styles.guestBtn} onPress={onGuest}>
          <Text style={styles.guestText}>Continue without account</Text>
        </Pressable>

        <Text style={styles.hint}>Explore the app now. Create an account anytime from Profile.</Text>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: L.bg },
  scroll: { paddingHorizontal: 20 },
  hero: { alignItems: 'center', paddingTop: 48, paddingBottom: 36 },
  logoCircle: {
    width: 72, height: 72, borderRadius: 36,
    backgroundColor: L.violet,
    alignItems: 'center', justifyContent: 'center',
    marginBottom: 16,
    shadowColor: L.violet, shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3, shadowRadius: 16, elevation: 8,
  },
  logoText: { fontSize: 36, fontWeight: '800', color: L.dark, letterSpacing: 6 },
  tagline: { color: L.textMid, marginTop: 8, fontSize: 14 },
  card: {
    backgroundColor: L.surface, borderRadius: L.radius.lg,
    padding: 20, marginBottom: 16,
    shadowColor: '#000', shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08, shadowRadius: 16, elevation: 4,
  },
  cardTitle: { fontSize: 20, fontWeight: '800', color: L.dark, marginBottom: 16 },
  err: { color: L.coral, fontSize: 13, marginBottom: 10, fontWeight: '600' },
  dividerRow: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 16 },
  divider: { flex: 1, height: 1, backgroundColor: L.border },
  dividerText: { color: L.textLight, fontSize: 13, fontWeight: '600' },
  guestBtn: {
    borderWidth: 1.5, borderColor: L.dark, borderRadius: L.radius.md,
    paddingVertical: 14, alignItems: 'center', marginBottom: 16,
  },
  guestText: { color: L.dark, fontWeight: '700', fontSize: 15 },
  hint: { color: L.textLight, textAlign: 'center', fontSize: 13, lineHeight: 20 },
});
