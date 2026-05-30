import { ClayButton, ClayInput } from '@/components/clay';
import { Icon } from '@/components/Icon';
import { L } from '@/constants/light';
import { createAccount, signOut } from '@/lib/auth';
import { notifyLocal } from '@/lib/notifications-local';
import { useGhostStore } from '@/store/ghostStore';
import { router } from 'expo-router';
import { useState } from 'react';
import { Pressable, ScrollView, StatusBar, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

export default function ProfileScreen() {
  const insets = useSafeAreaInsets();
  const user = useGhostStore((s) => s.user);
  const isPro = useGhostStore((s) => s.isPro);
  const isGuest = useGhostStore((s) => s.isGuest);
  const isAuthenticated = useGhostStore((s) => s.isAuthenticated);
  const setAuth = useGhostStore((s) => s.setAuth);
  const [email, setEmail] = useState('');
  const [name, setName] = useState('');
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState('');

  const onCreateAccount = async () => {
    if (!email.trim()) { setMsg('Email is required'); return; }
    setLoading(true);
    try {
      await createAccount(email, name || email.split('@')[0]);
      setAuth({ isGuest: false, isAuthenticated: true, email: email.trim(), name: name.trim() || email.split('@')[0] });
      setMsg('Account created.');
      await notifyLocal('Welcome to Ghost', 'Your account is ready.');
    } catch (e) {
      setMsg(String(e));
    } finally {
      setLoading(false);
    }
  };

  const firstName = user.name?.split(' ')[0] ?? 'Guest';

  return (
    <View style={[styles.root, { paddingTop: insets.top }]}>
      <StatusBar barStyle="dark-content" />
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 60 }}>
        {/* Header */}
        <View style={styles.header}>
          <Pressable onPress={() => router.back()} style={styles.backBtn} hitSlop={12}>
            <Icon name="back" size={20} color={L.dark} />
          </Pressable>
          <Text style={styles.title}>Profile</Text>
        </View>

        {/* Avatar hero */}
        <View style={[styles.hero, { backgroundColor: isPro ? L.violet : L.dark }]}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>{firstName[0]?.toUpperCase()}</Text>
          </View>
          <Text style={styles.heroName}>{user.name}</Text>
          <Text style={styles.heroEmail}>{user.email || 'No email (guest)'}</Text>
          <View style={styles.planBadge}>
            <Icon name="sparkles" size={12} color={isPro ? L.yellow : '#fff'} />
            <Text style={[styles.planText, { color: isPro ? L.yellow : 'rgba(255,255,255,0.7)' }]}>
              {isPro ? 'Ghost Pro' : 'Free tier'}
            </Text>
          </View>
        </View>

        <View style={styles.body}>
          {/* Stats row */}
          <View style={styles.statsRow}>
            <View style={styles.statCard}>
              <Text style={styles.statNum}>{user.creditsTotal - user.creditsUsed}</Text>
              <Text style={styles.statLabel}>Credits left</Text>
            </View>
            <View style={styles.statCard}>
              <Text style={styles.statNum}>{user.creditsUsed}</Text>
              <Text style={styles.statLabel}>Used</Text>
            </View>
            <View style={styles.statCard}>
              <Text style={styles.statNum}>{user.creditsTotal}</Text>
              <Text style={styles.statLabel}>Total</Text>
            </View>
          </View>

          {/* Create account */}
          {isGuest && !isAuthenticated ? (
            <View style={styles.card}>
              <Text style={styles.cardTitle}>Create account</Text>
              <Text style={styles.cardSub}>Save memory, sync plans, and unlock cloud backup.</Text>
              <ClayInput label="Email" value={email} onChangeText={setEmail} autoCapitalize="none" keyboardType="email-address" />
              <ClayInput label="Name" value={name} onChangeText={setName} />
              {msg ? <Text style={styles.msg}>{msg}</Text> : null}
              <ClayButton label="Create account" onPress={onCreateAccount} loading={loading} />
            </View>
          ) : null}

          <ClayButton label="Upgrade to Ghost Pro" onPress={() => router.push('/subscription')} style={{ backgroundColor: L.violet }} />

          {!isGuest ? (
            <ClayButton
              label="Sign out"
              variant="ghost"
              onPress={async () => {
                await signOut();
                setAuth({ isGuest: true, isAuthenticated: false, name: 'Guest', email: '' });
                router.replace('/(auth)/login');
              }}
            />
          ) : null}
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: L.bg },
  header: { flexDirection: 'row', alignItems: 'center', gap: 14, paddingHorizontal: 16, paddingTop: 8, paddingBottom: 12 },
  backBtn: { width: 40, height: 40, borderRadius: 20, backgroundColor: L.surface, alignItems: 'center', justifyContent: 'center', shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.08, shadowRadius: 6, elevation: 2 },
  title: { fontSize: 24, fontWeight: '800', color: L.dark },
  hero: { marginHorizontal: 16, borderRadius: L.radius.lg, padding: 28, alignItems: 'center', marginBottom: 16 },
  avatar: { width: 72, height: 72, borderRadius: 36, backgroundColor: 'rgba(255,255,255,0.2)', alignItems: 'center', justifyContent: 'center', marginBottom: 12 },
  avatarText: { color: '#fff', fontSize: 28, fontWeight: '800' },
  heroName: { color: '#fff', fontSize: 22, fontWeight: '800' },
  heroEmail: { color: 'rgba(255,255,255,0.65)', fontSize: 14, marginTop: 4 },
  planBadge: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 12, backgroundColor: 'rgba(255,255,255,0.15)', paddingHorizontal: 12, paddingVertical: 5, borderRadius: L.radius.pill },
  planText: { fontSize: 13, fontWeight: '700' },
  body: { paddingHorizontal: 16 },
  statsRow: { flexDirection: 'row', gap: 10, marginBottom: 16 },
  statCard: { flex: 1, backgroundColor: L.surface, borderRadius: L.radius.md, padding: 14, alignItems: 'center', shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.06, shadowRadius: 8, elevation: 2 },
  statNum: { fontSize: 24, fontWeight: '800', color: L.dark },
  statLabel: { fontSize: 11, color: L.textLight, marginTop: 2, fontWeight: '600' },
  card: { backgroundColor: L.surface, borderRadius: L.radius.lg, padding: 18, marginBottom: 16, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.06, shadowRadius: 10, elevation: 3 },
  cardTitle: { fontSize: 17, fontWeight: '800', color: L.dark, marginBottom: 6 },
  cardSub: { color: L.textMid, fontSize: 13, marginBottom: 14, lineHeight: 18 },
  msg: { color: L.mint, marginBottom: 8, fontSize: 13, fontWeight: '600' },
});
