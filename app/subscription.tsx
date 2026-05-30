import { ClayButton } from '@/components/clay';
import { Icon } from '@/components/Icon';
import { L } from '@/constants/light';
import { purchaseGhostPro } from '@/lib/entitlements';
import { notifyLocal } from '@/lib/notifications-local';
import { useGhostStore } from '@/store/ghostStore';
import { router } from 'expo-router';
import { useState } from 'react';
import { Pressable, ScrollView, StatusBar, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

const perks = [
  { icon: 'zap' as const, text: 'Unlimited watchdogs & automations', color: L.yellow },
  { icon: 'shield' as const, text: 'App Mesh accessibility automation', color: L.violet },
  { icon: 'sparkles' as const, text: 'Priority agent execution', color: L.coral },
  { icon: 'card' as const, text: 'UPI and cards via Razorpay', color: L.mint },
  { icon: 'brain' as const, text: 'Extended memory & knowledge graph', color: L.orange },
];

export default function SubscriptionScreen() {
  const insets = useSafeAreaInsets();
  const setPro = useGhostStore((s) => s.setPro);
  const isPro = useGhostStore((s) => s.isPro);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const subscribe = async () => {
    setLoading(true); setError(''); setSuccess('');
    try {
      const r = await purchaseGhostPro();
      if (r.success) {
        setPro(true);
        setSuccess('Ghost Pro activated.');
        await notifyLocal('Ghost Pro', 'Subscription active. Unlimited watchdogs unlocked.');
      } else {
        setError(r.error ?? 'Payment failed');
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={[styles.root, { paddingTop: insets.top }]}>
      <StatusBar barStyle="dark-content" />
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 60 }}>
        {/* Header */}
        <View style={styles.header}>
          <Pressable onPress={() => router.back()} style={styles.backBtn} hitSlop={12}>
            <Icon name="back" size={20} color={L.dark} />
          </Pressable>
          <Text style={styles.title}>Ghost Pro</Text>
        </View>

        {/* Hero pricing card */}
        <View style={styles.heroCard}>
          <View style={styles.proBadge}>
            <Icon name="sparkles" size={14} color={L.yellow} />
            <Text style={styles.proBadgeText}>PRO</Text>
          </View>
          <Text style={styles.price}>₹199</Text>
          <Text style={styles.period}>per month · India billing</Text>
          {isPro && (
            <View style={styles.activeBadge}>
              <Icon name="check" size={14} color={L.mint} />
              <Text style={styles.activeText}>Active</Text>
            </View>
          )}
        </View>

        {/* Perks */}
        <View style={styles.perksCard}>
          <Text style={styles.perksTitle}>What's included</Text>
          {perks.map((p) => (
            <View key={p.text} style={styles.perkRow}>
              <View style={[styles.perkIcon, { backgroundColor: p.color + '18' }]}>
                <Icon name={p.icon} size={16} color={p.color} />
              </View>
              <Text style={styles.perkText}>{p.text}</Text>
            </View>
          ))}
        </View>

        {error ? <View style={styles.errorCard}><Text style={styles.errorText}>{error}</Text></View> : null}
        {success ? <View style={styles.successCard}><Text style={styles.successText}>{success}</Text></View> : null}

        <View style={{ paddingHorizontal: 16 }}>
          <ClayButton
            label={isPro ? 'Pro active' : 'Subscribe — ₹199/mo'}
            onPress={subscribe}
            loading={loading}
            disabled={isPro}
            style={{ backgroundColor: isPro ? L.mint : L.violet }}
          />
          <ClayButton label="Restore purchases" variant="ghost" onPress={subscribe} />
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
  heroCard: { marginHorizontal: 16, backgroundColor: L.dark, borderRadius: L.radius.lg, padding: 28, alignItems: 'center', marginBottom: 16 },
  proBadge: { flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: 'rgba(245,200,66,0.15)', paddingHorizontal: 12, paddingVertical: 5, borderRadius: L.radius.pill, marginBottom: 16 },
  proBadgeText: { color: L.yellow, fontWeight: '800', fontSize: 12, letterSpacing: 1 },
  price: { color: '#fff', fontSize: 52, fontWeight: '800', letterSpacing: -1 },
  period: { color: 'rgba(255,255,255,0.55)', fontSize: 14, marginTop: 4 },
  activeBadge: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 16, backgroundColor: 'rgba(62,207,178,0.15)', paddingHorizontal: 14, paddingVertical: 6, borderRadius: L.radius.pill },
  activeText: { color: L.mint, fontWeight: '700', fontSize: 13 },
  perksCard: { marginHorizontal: 16, backgroundColor: L.surface, borderRadius: L.radius.lg, padding: 18, marginBottom: 16, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.06, shadowRadius: 10, elevation: 3 },
  perksTitle: { fontSize: 15, fontWeight: '800', color: L.dark, marginBottom: 14 },
  perkRow: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 12 },
  perkIcon: { width: 36, height: 36, borderRadius: 18, alignItems: 'center', justifyContent: 'center' },
  perkText: { color: L.dark, fontSize: 14, flex: 1, fontWeight: '500' },
  errorCard: { marginHorizontal: 16, backgroundColor: 'rgba(232,80,58,0.08)', borderRadius: L.radius.md, padding: 14, marginBottom: 12 },
  errorText: { color: L.coral, fontSize: 14, fontWeight: '600' },
  successCard: { marginHorizontal: 16, backgroundColor: 'rgba(62,207,178,0.10)', borderRadius: L.radius.md, padding: 14, marginBottom: 12 },
  successText: { color: L.mint, fontWeight: '700', fontSize: 14 },
});
