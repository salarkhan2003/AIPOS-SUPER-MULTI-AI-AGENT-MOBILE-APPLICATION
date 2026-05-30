import { Icon } from '@/components/Icon';
import { L } from '@/constants/light';
import { notifyLocal } from '@/lib/notifications-local';
import { storage } from '@/lib/storage';
import { router } from 'expo-router';
import { useEffect, useState } from 'react';
import {
    Pressable,
    ScrollView,
    StatusBar,
    StyleSheet,
    Text,
    View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

type Integration = {
  id: string; name: string; desc: string;
  icon: 'mail' | 'calendar' | 'globe' | 'network' | 'zap' | 'shield';
  color: string; bg: string; category: string;
};

const INTEGRATIONS: Integration[] = [
  { id: 'gmail',    name: 'Gmail',           desc: 'Read & draft emails via Communication agent', icon: 'mail',     color: L.coral,  bg: 'rgba(232,80,58,0.10)',   category: 'Productivity' },
  { id: 'gcal',     name: 'Google Calendar', desc: 'Sync events and create watchdog reminders',   icon: 'calendar', color: L.blue,   bg: 'rgba(58,142,240,0.10)',  category: 'Productivity' },
  { id: 'irctc',    name: 'IRCTC Browser',   desc: 'Auto-fill train booking via Browser agent',   icon: 'globe',    color: L.mint,   bg: 'rgba(62,207,178,0.10)',  category: 'Travel' },
  { id: 'whatsapp', name: 'WhatsApp',        desc: 'Send messages via App Mesh accessibility',    icon: 'network',  color: L.violet, bg: 'rgba(91,79,232,0.10)',   category: 'Communication' },
  { id: 'razorpay', name: 'Razorpay',        desc: 'UPI & card billing for Ghost Pro',            icon: 'zap',      color: L.yellow, bg: 'rgba(245,200,66,0.15)',  category: 'Payments' },
  { id: 'custom',   name: 'Custom API',      desc: 'Connect any REST endpoint to the orchestrator', icon: 'shield', color: L.orange, bg: 'rgba(240,122,58,0.10)', category: 'Developer' },
];

const STORAGE_KEY = 'ghost:integrations';

export default function IntegrationsScreen() {
  const insets = useSafeAreaInsets();
  const [connected, setConnected] = useState<Record<string, boolean>>({});

  useEffect(() => {
    storage.get<Record<string, boolean>>(STORAGE_KEY).then((v) => {
      setConnected(v ?? { irctc: true });
    });
  }, []);

  const toggle = async (id: string) => {
    const next = { ...connected, [id]: !connected[id] };
    setConnected(next);
    await storage.set(STORAGE_KEY, next);
    if (next[id]) {
      await notifyLocal(`${INTEGRATIONS.find(i => i.id === id)?.name} connected`, 'Integration is now active.', {}, 'task');
    }
  };

  const categories = [...new Set(INTEGRATIONS.map((i) => i.category))];
  const connectedCount = Object.values(connected).filter(Boolean).length;

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
            <Text style={styles.subtitle}>{connectedCount} of {INTEGRATIONS.length} connected</Text>
          </View>
        </View>

        {/* Summary bar */}
        <View style={styles.summaryBar}>
          <View style={[styles.summaryCard, { backgroundColor: L.mint }]}>
            <Text style={styles.summaryNum}>{connectedCount}</Text>
            <Text style={styles.summaryLabel}>Active</Text>
          </View>
          <View style={[styles.summaryCard, { backgroundColor: L.violet }]}>
            <Text style={styles.summaryNum}>{INTEGRATIONS.length - connectedCount}</Text>
            <Text style={styles.summaryLabel}>Available</Text>
          </View>
          <View style={[styles.summaryCard, { backgroundColor: L.orange }]}>
            <Text style={styles.summaryNum}>{categories.length}</Text>
            <Text style={styles.summaryLabel}>Categories</Text>
          </View>
        </View>

        {categories.map((cat) => (
          <View key={cat}>
            <Text style={styles.sectionLabel}>{cat.toUpperCase()}</Text>
            {INTEGRATIONS.filter((i) => i.category === cat).map((item) => {
              const isOn = !!connected[item.id];
              return (
                <Pressable key={item.id} style={styles.card} onPress={() => toggle(item.id)}>
                  <View style={[styles.iconWrap, { backgroundColor: item.bg }]}>
                    <Icon name={item.icon} size={22} color={item.color} />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.name}>{item.name}</Text>
                    <Text style={styles.desc}>{item.desc}</Text>
                  </View>
                  <View style={[styles.badge, { backgroundColor: isOn ? 'rgba(62,207,178,0.12)' : L.bg }]}>
                    {isOn && <Icon name="check" size={10} color={L.mint} />}
                    <Text style={[styles.badgeText, { color: isOn ? L.mint : L.textLight }]}>
                      {isOn ? 'On' : 'Off'}
                    </Text>
                  </View>
                </Pressable>
              );
            })}
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
  summaryBar: { flexDirection: 'row', gap: 10, paddingHorizontal: 16, marginBottom: 16 },
  summaryCard: { flex: 1, borderRadius: 16, padding: 14, alignItems: 'center' },
  summaryNum: { color: '#fff', fontSize: 22, fontWeight: '800' },
  summaryLabel: { color: 'rgba(255,255,255,0.7)', fontSize: 11, marginTop: 2 },
  sectionLabel: { fontSize: 11, fontWeight: '800', color: L.textLight, letterSpacing: 1.2, marginBottom: 8, paddingHorizontal: 16 },
  card: { flexDirection: 'row', alignItems: 'center', gap: 14, marginHorizontal: 16, backgroundColor: L.surface, borderRadius: 18, padding: 16, marginBottom: 10, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.06, shadowRadius: 8, elevation: 2 },
  iconWrap: { width: 48, height: 48, borderRadius: 24, alignItems: 'center', justifyContent: 'center' },
  name: { color: L.dark, fontWeight: '700', fontSize: 15 },
  desc: { color: L.textMid, fontSize: 12, marginTop: 2, lineHeight: 16 },
  badge: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 10, paddingVertical: 5, borderRadius: 12 },
  badgeText: { fontSize: 12, fontWeight: '700' },
});
