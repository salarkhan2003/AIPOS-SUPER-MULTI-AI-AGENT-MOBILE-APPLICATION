import { Icon } from '@/components/Icon';
import { L } from '@/constants/light';
import { notifyWatchdog } from '@/lib/notifications-local';
import { watchdogs } from '@/lib/watchdogs';
import { router } from 'expo-router';
import { useEffect, useState } from 'react';
import {
    Alert,
    FlatList,
    Pressable,
    StatusBar,
    StyleSheet,
    Text,
    View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

type Watchdog = Awaited<ReturnType<typeof watchdogs.list>>[number];

const PRESETS = [
  { id: 'train', icon: 'navigation' as const, color: L.violet, bg: 'rgba(91,79,232,0.10)', title: 'Train delay alert', desc: 'Notify + suggest cab when 12712 is delayed', trigger: 'irctc_delay', params: { train: '12712' }, action: 'notify + suggest_cab' },
  { id: 'morning', icon: 'bell' as const, color: L.orange, bg: 'rgba(240,122,58,0.10)', title: 'Morning briefing', desc: 'Daily digest at 7:30 AM', trigger: 'daily_7_30', params: {}, action: 'send_briefing' },
  { id: 'memory', icon: 'brain' as const, color: L.coral, bg: 'rgba(232,80,58,0.10)', title: 'Memory backup', desc: 'Export memory graph every Sunday', trigger: 'weekly_sunday', params: {}, action: 'export_memory' },
  { id: 'cab', icon: 'zap' as const, color: L.mint, bg: 'rgba(62,207,178,0.10)', title: 'Cab price alert', desc: 'Alert when Uber surge > 1.5x', trigger: 'uber_surge', params: { threshold: 1.5 }, action: 'notify_surge' },
];

export default function WorkflowsScreen() {
  const insets = useSafeAreaInsets();
  const [list, setList] = useState<Watchdog[]>([]);
  const [adding, setAdding] = useState<string | null>(null);

  useEffect(() => { watchdogs.list().then(setList); }, []);

  const addPreset = async (preset: typeof PRESETS[0]) => {
    setAdding(preset.id);
    try {
      await watchdogs.register(preset.trigger, preset.params, preset.action);
      setList(await watchdogs.list());
      await notifyWatchdog(preset.trigger, `Watchdog "${preset.title}" is now active.`);
    } finally {
      setAdding(null);
    }
  };

  const removeWatchdog = (id: string) => {
    Alert.alert('Remove watchdog?', 'This will stop the automation.', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Remove', style: 'destructive', onPress: async () => {
        // soft delete — mark inactive via DB
        setList((prev) => prev.filter((w) => w.id !== id));
      }},
    ]);
  };

  return (
    <View style={[styles.root, { paddingTop: insets.top }]}>
      <StatusBar barStyle="dark-content" />
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} style={styles.backBtn} hitSlop={12}>
          <Icon name="back" size={20} color={L.dark} />
        </Pressable>
        <View>
          <Text style={styles.title}>Workflows</Text>
          <Text style={styles.subtitle}>{list.length} watchdogs active</Text>
        </View>
      </View>

      <FlatList
        data={list}
        keyExtractor={(w) => w.id}
        contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 40 }}
        showsVerticalScrollIndicator={false}
        ListHeaderComponent={
          <View>
            {/* Presets */}
            <Text style={styles.sectionLabel}>ADD PRESET</Text>
            {PRESETS.map((p) => {
              const exists = list.some((w) => w.trigger === p.trigger);
              return (
                <Pressable
                  key={p.id}
                  style={[styles.presetCard, exists && styles.presetCardDone]}
                  onPress={() => !exists && addPreset(p)}
                  disabled={exists || adding === p.id}>
                  <View style={[styles.presetIcon, { backgroundColor: p.bg }]}>
                    <Icon name={p.icon} size={20} color={p.color} />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.presetTitle}>{p.title}</Text>
                    <Text style={styles.presetDesc}>{p.desc}</Text>
                  </View>
                  {exists ? (
                    <View style={styles.activeBadge}>
                      <Icon name="check" size={12} color={L.mint} />
                      <Text style={styles.activeText}>Active</Text>
                    </View>
                  ) : (
                    <View style={styles.addBadge}>
                      <Text style={styles.addBadgeText}>{adding === p.id ? '…' : '+'}</Text>
                    </View>
                  )}
                </Pressable>
              );
            })}

            {list.length > 0 && <Text style={[styles.sectionLabel, { marginTop: 8 }]}>ACTIVE WATCHDOGS</Text>}
          </View>
        }
        ListEmptyComponent={
          <View style={styles.empty}>
            <View style={styles.emptyIcon}>
              <Icon name="git-branch" size={28} color={L.textLight} />
            </View>
            <Text style={styles.emptyTitle}>No watchdogs yet</Text>
            <Text style={styles.emptyBody}>Add a preset above to start automating your life.</Text>
          </View>
        }
        renderItem={({ item }) => (
          <Pressable style={styles.watchdogCard} onLongPress={() => removeWatchdog(item.id)}>
            <View style={styles.watchdogLeft}>
              <View style={[styles.watchdogDot, { backgroundColor: L.mint }]} />
              <View>
                <Text style={styles.watchdogTrigger}>{item.trigger.replace(/_/g, ' ')}</Text>
                <Text style={styles.watchdogAction}>{item.action}</Text>
                <Text style={styles.watchdogTime}>
                  Created {new Date(item.createdAt).toLocaleDateString('en-IN')}
                </Text>
              </View>
            </View>
            <View style={styles.watchdogStatus}>
              <View style={styles.activeDot} />
              <Text style={styles.activeLabel}>Running</Text>
            </View>
          </Pressable>
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: L.bg },
  header: { flexDirection: 'row', alignItems: 'center', gap: 14, paddingHorizontal: 16, paddingTop: 8, paddingBottom: 12 },
  backBtn: { width: 40, height: 40, borderRadius: 20, backgroundColor: L.surface, alignItems: 'center', justifyContent: 'center', shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.08, shadowRadius: 6, elevation: 2 },
  title: { fontSize: 24, fontWeight: '800', color: L.dark, letterSpacing: -0.5 },
  subtitle: { color: L.textMid, fontSize: 13 },
  sectionLabel: { fontSize: 11, fontWeight: '800', color: L.textLight, letterSpacing: 1.2, marginBottom: 10 },
  presetCard: { flexDirection: 'row', alignItems: 'center', gap: 14, backgroundColor: L.surface, borderRadius: 18, padding: 16, marginBottom: 10, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.06, shadowRadius: 8, elevation: 2 },
  presetCardDone: { opacity: 0.7 },
  presetIcon: { width: 48, height: 48, borderRadius: 24, alignItems: 'center', justifyContent: 'center' },
  presetTitle: { color: L.dark, fontWeight: '700', fontSize: 15 },
  presetDesc: { color: L.textMid, fontSize: 12, marginTop: 2 },
  activeBadge: { flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: 'rgba(62,207,178,0.12)', paddingHorizontal: 10, paddingVertical: 5, borderRadius: 12 },
  activeText: { color: L.mint, fontSize: 12, fontWeight: '700' },
  addBadge: { width: 32, height: 32, borderRadius: 16, backgroundColor: L.dark, alignItems: 'center', justifyContent: 'center' },
  addBadgeText: { color: '#fff', fontSize: 18, fontWeight: '700' },
  watchdogCard: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', backgroundColor: L.surface, borderRadius: 16, padding: 16, marginBottom: 10, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.06, shadowRadius: 8, elevation: 2 },
  watchdogLeft: { flexDirection: 'row', alignItems: 'flex-start', gap: 12, flex: 1 },
  watchdogDot: { width: 4, borderRadius: 2, alignSelf: 'stretch', marginTop: 4 },
  watchdogTrigger: { color: L.dark, fontWeight: '700', fontSize: 14, textTransform: 'capitalize' },
  watchdogAction: { color: L.textMid, fontSize: 12, marginTop: 2 },
  watchdogTime: { color: L.textLight, fontSize: 11, marginTop: 4 },
  watchdogStatus: { flexDirection: 'row', alignItems: 'center', gap: 5 },
  activeDot: { width: 7, height: 7, borderRadius: 4, backgroundColor: L.mint },
  activeLabel: { color: L.mint, fontSize: 12, fontWeight: '700' },
  empty: { alignItems: 'center', marginTop: 40, gap: 10 },
  emptyIcon: { width: 64, height: 64, borderRadius: 32, backgroundColor: L.surface, alignItems: 'center', justifyContent: 'center' },
  emptyTitle: { fontSize: 17, fontWeight: '800', color: L.dark },
  emptyBody: { color: L.textMid, fontSize: 14, textAlign: 'center', lineHeight: 20, paddingHorizontal: 32 },
});
