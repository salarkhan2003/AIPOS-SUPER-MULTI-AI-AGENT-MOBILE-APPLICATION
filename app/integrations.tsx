import { Icon } from '@/components/Icon';
import { L } from '@/constants/light';
import { router } from 'expo-router';
import { Pressable, ScrollView, StatusBar, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

type Integration = { name: string; desc: string; icon: 'mail' | 'calendar' | 'globe' | 'network' | 'zap'; color: string; connected: boolean };

const integrations: Integration[] = [
  { name: 'Gmail', desc: 'Read & draft emails via Communication agent', icon: 'mail', color: L.coral, connected: false },
  { name: 'Google Calendar', desc: 'Sync events and create watchdog reminders', icon: 'calendar', color: L.blue, connected: false },
  { name: 'IRCTC Browser', desc: 'Auto-fill train booking via Browser agent', icon: 'globe', color: L.mint, connected: true },
  { name: 'Custom API', desc: 'Connect any REST endpoint to the orchestrator', icon: 'network', color: L.violet, connected: false },
  { name: 'Razorpay', desc: 'UPI & card billing for Ghost Pro', icon: 'zap', color: L.yellow, connected: false },
];

export default function IntegrationsScreen() {
  const insets = useSafeAreaInsets();
  return (
    <View style={[styles.root, { paddingTop: insets.top }]}>
      <StatusBar barStyle="dark-content" />
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 60 }}>
        <View style={styles.header}>
          <Pressable onPress={() => router.back()} style={styles.backBtn} hitSlop={12}>
            <Icon name="back" size={20} color={L.dark} />
          </Pressable>
          <View>
            <Text style={styles.title}>Integrations</Text>
            <Text style={styles.subtitle}>{integrations.filter(i => i.connected).length} connected</Text>
          </View>
        </View>

        <Text style={styles.sectionLabel}>ALL INTEGRATIONS</Text>
        {integrations.map((item) => (
          <View key={item.name} style={styles.card}>
            <View style={[styles.iconWrap, { backgroundColor: item.color + '18' }]}>
              <Icon name={item.icon} size={22} color={item.color} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.name}>{item.name}</Text>
              <Text style={styles.desc}>{item.desc}</Text>
            </View>
            <View style={[styles.badge, { backgroundColor: item.connected ? 'rgba(62,207,178,0.12)' : L.bg }]}>
              <Text style={[styles.badgeText, { color: item.connected ? L.mint : L.textLight }]}>
                {item.connected ? 'Connected' : 'Connect'}
              </Text>
            </View>
          </View>
        ))}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: L.bg },
  header: { flexDirection: 'row', alignItems: 'center', gap: 14, paddingHorizontal: 16, paddingTop: 8, paddingBottom: 12 },
  backBtn: { width: 40, height: 40, borderRadius: 20, backgroundColor: L.surface, alignItems: 'center', justifyContent: 'center', shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.08, shadowRadius: 6, elevation: 2 },
  title: { fontSize: 24, fontWeight: '800', color: L.dark, letterSpacing: -0.5 },
  subtitle: { color: L.textMid, fontSize: 13 },
  sectionLabel: { fontSize: 11, fontWeight: '800', color: L.textLight, letterSpacing: 1.2, marginBottom: 10, paddingHorizontal: 16 },
  card: { flexDirection: 'row', alignItems: 'center', gap: 14, marginHorizontal: 16, backgroundColor: L.surface, borderRadius: L.radius.lg, padding: 16, marginBottom: 10, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.06, shadowRadius: 8, elevation: 2 },
  iconWrap: { width: 48, height: 48, borderRadius: 24, alignItems: 'center', justifyContent: 'center' },
  name: { color: L.dark, fontWeight: '700', fontSize: 15 },
  desc: { color: L.textMid, fontSize: 12, marginTop: 2, lineHeight: 16 },
  badge: { paddingHorizontal: 10, paddingVertical: 5, borderRadius: L.radius.pill },
  badgeText: { fontSize: 12, fontWeight: '700' },
});
