import { Icon } from '@/components/Icon';
import { L } from '@/constants/light';
import { listAuditLogs } from '@/lib/audit';
import { formatDisplayText } from '@/lib/displayText';
import { memory } from '@/lib/memory';
import { scheduleLocalIn } from '@/lib/notifications-local';
import { router } from 'expo-router';
import { useEffect, useState } from 'react';
import { Pressable, ScrollView, StatusBar, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

interface BriefingData {
  memoryHighlights: string[];
  recentActivity: { action: string; result: string; time: string }[];
  reminders: string[];
}

const TIPS = [
  'Say "Hey Ghost, book cab to station" to trigger the executor agent.',
  'Long-press any note to delete it.',
  'Watchdogs run in the background and alert you automatically.',
  'Your memory graph grows every time you run a command.',
  'Use the Neural Log to see exactly what each agent is thinking.',
];

export default function BriefingScreen() {
  const insets = useSafeAreaInsets();
  const [data, setData] = useState<BriefingData>({ memoryHighlights: [], recentActivity: [], reminders: [] });
  const [loading, setLoading] = useState(true);
  const tip = TIPS[new Date().getDay() % TIPS.length];

  useEffect(() => {
    (async () => {
      const [logs, mems] = await Promise.all([
        listAuditLogs(20),
        memory.list(10),
      ]);

      const recentActivity = logs.slice(0, 5).map((l) => ({
        action: l.action.replace(/_/g, ' '),
        result: formatDisplayText(l.result ?? '').slice(0, 80),
        time: new Date(l.timestamp).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' }),
      }));

      const memoryHighlights = mems
        .filter((m) => m.type === 'episodic' || m.type === 'semantic')
        .slice(0, 4)
        .map((m) => formatDisplayText(m.text).slice(0, 100));

      setData({ memoryHighlights, recentActivity, reminders: [] });
      setLoading(false);
    })();
  }, []);

  const now = new Date();
  const hour = now.getHours();
  const greeting = hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening';
  const dateStr = now.toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });

  const testNotif = () =>
    scheduleLocalIn(3, 'Ghost Briefing', 'Your daily digest is ready. Tap to review.', 'briefing');

  return (
    <View style={[styles.root, { paddingTop: insets.top }]}>
      <StatusBar barStyle="dark-content" />
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 60 }}>

        {/* Header */}
        <View style={styles.header}>
          <Pressable onPress={() => router.back()} style={styles.backBtn} hitSlop={12}>
            <Icon name="back" size={20} color={L.dark} />
          </Pressable>
          <View style={{ flex: 1 }}>
            <Text style={styles.title}>Daily Briefing</Text>
            <Text style={styles.subtitle}>{dateStr}</Text>
          </View>
          <Pressable style={styles.notifBtn} onPress={testNotif}>
            <Icon name="bell" size={16} color={L.violet} />
          </Pressable>
        </View>

        {/* Hero */}
        <View style={styles.hero}>
          <View style={styles.heroTop}>
            <View style={styles.heroBadge}>
              <Icon name="sparkles" size={12} color={L.yellow} />
              <Text style={styles.heroBadgeText}>AI DIGEST</Text>
            </View>
            <Text style={styles.heroGreeting}>{greeting}!</Text>
            <Text style={styles.heroSub}>Here's everything on your radar today.</Text>
          </View>
          <View style={styles.heroStats}>
            <View style={styles.heroStat}>
              <Text style={styles.heroStatNum}>{data.recentActivity.length}</Text>
              <Text style={styles.heroStatLabel}>Tasks run</Text>
            </View>
            <View style={styles.heroStatDivider} />
            <View style={styles.heroStat}>
              <Text style={styles.heroStatNum}>{data.memoryHighlights.length}</Text>
              <Text style={styles.heroStatLabel}>Memories</Text>
            </View>
            <View style={styles.heroStatDivider} />
            <View style={styles.heroStat}>
              <Text style={styles.heroStatNum}>0</Text>
              <Text style={styles.heroStatLabel}>Reminders</Text>
            </View>
          </View>
        </View>

        {/* Tip of the day */}
        <View style={styles.tipCard}>
          <View style={styles.tipIcon}>
            <Icon name="zap" size={16} color={L.yellow} />
          </View>
          <Text style={styles.tipText}>{tip}</Text>
        </View>

        {/* Recent activity */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <View style={[styles.sectionDot, { backgroundColor: L.coral }]} />
            <Text style={styles.sectionTitle}>Recent Activity</Text>
          </View>
          {loading ? (
            <View style={styles.card}><Text style={styles.loadingText}>Loading…</Text></View>
          ) : data.recentActivity.length === 0 ? (
            <View style={styles.card}>
              <Text style={styles.emptyText}>No activity yet. Run a command from Home or Voice.</Text>
            </View>
          ) : (
            data.recentActivity.map((a, i) => (
              <View key={i} style={styles.activityRow}>
                <View style={[styles.activityDot, { backgroundColor: L.coral }]} />
                <View style={{ flex: 1 }}>
                  <Text style={styles.activityAction}>{a.action}</Text>
                  {a.result ? <Text style={styles.activityResult} numberOfLines={2}>{a.result}</Text> : null}
                </View>
                <Text style={styles.activityTime}>{a.time}</Text>
              </View>
            ))
          )}
        </View>

        {/* Memory highlights */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <View style={[styles.sectionDot, { backgroundColor: L.violet }]} />
            <Text style={styles.sectionTitle}>Memory Highlights</Text>
          </View>
          {loading ? (
            <View style={styles.card}><Text style={styles.loadingText}>Loading…</Text></View>
          ) : data.memoryHighlights.length === 0 ? (
            <View style={styles.card}>
              <Text style={styles.emptyText}>Memory builds as you use Ghost. Start talking!</Text>
            </View>
          ) : (
            data.memoryHighlights.map((m, i) => (
              <View key={i} style={[styles.memCard, { borderLeftColor: [L.violet, L.mint, L.coral, L.orange][i % 4] }]}>
                <Text style={styles.memText}>{m}</Text>
              </View>
            ))
          )}
        </View>

        {/* Reminders */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <View style={[styles.sectionDot, { backgroundColor: L.orange }]} />
            <Text style={styles.sectionTitle}>Reminders</Text>
          </View>
          <View style={styles.card}>
            <Text style={styles.emptyText}>No reminders set. Add watchdogs from Workflows to get alerts.</Text>
            <Pressable style={styles.linkBtn} onPress={() => router.push('/workflow-builder')}>
              <Text style={styles.linkBtnText}>Go to Workflows</Text>
              <Icon name="forward" size={14} color={L.violet} />
            </Pressable>
          </View>
        </View>

      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: L.bg },
  header: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingHorizontal: 16, paddingTop: 8, paddingBottom: 12 },
  backBtn: { width: 40, height: 40, borderRadius: 20, backgroundColor: L.surface, alignItems: 'center', justifyContent: 'center', shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.08, shadowRadius: 6, elevation: 2 },
  title: { fontSize: 22, fontWeight: '800', color: L.dark, letterSpacing: -0.5 },
  subtitle: { color: L.textMid, fontSize: 12 },
  notifBtn: { width: 40, height: 40, borderRadius: 20, backgroundColor: 'rgba(91,79,232,0.10)', alignItems: 'center', justifyContent: 'center' },
  hero: { marginHorizontal: 16, backgroundColor: L.dark, borderRadius: 24, marginBottom: 14, overflow: 'hidden' },
  heroTop: { padding: 22 },
  heroBadge: { flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: 'rgba(245,200,66,0.15)', alignSelf: 'flex-start', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 20, marginBottom: 10 },
  heroBadgeText: { color: L.yellow, fontSize: 10, fontWeight: '800', letterSpacing: 1 },
  heroGreeting: { color: '#fff', fontSize: 26, fontWeight: '800', letterSpacing: -0.5 },
  heroSub: { color: 'rgba(255,255,255,0.6)', fontSize: 14, marginTop: 4 },
  heroStats: { flexDirection: 'row', borderTopWidth: 1, borderTopColor: 'rgba(255,255,255,0.08)' },
  heroStat: { flex: 1, alignItems: 'center', paddingVertical: 16 },
  heroStatNum: { color: '#fff', fontSize: 22, fontWeight: '800' },
  heroStatLabel: { color: 'rgba(255,255,255,0.5)', fontSize: 11, marginTop: 2 },
  heroStatDivider: { width: 1, backgroundColor: 'rgba(255,255,255,0.08)', marginVertical: 12 },
  tipCard: { flexDirection: 'row', alignItems: 'flex-start', gap: 12, marginHorizontal: 16, backgroundColor: 'rgba(245,200,66,0.12)', borderRadius: 16, padding: 14, marginBottom: 14 },
  tipIcon: { width: 32, height: 32, borderRadius: 16, backgroundColor: 'rgba(245,200,66,0.2)', alignItems: 'center', justifyContent: 'center' },
  tipText: { flex: 1, color: L.dark, fontSize: 13, lineHeight: 19, fontWeight: '500' },
  section: { marginHorizontal: 16, marginBottom: 16 },
  sectionHeader: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 10 },
  sectionDot: { width: 8, height: 8, borderRadius: 4 },
  sectionTitle: { fontSize: 13, fontWeight: '800', color: L.dark, letterSpacing: 0.3 },
  card: { backgroundColor: L.surface, borderRadius: 16, padding: 16, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 8, elevation: 2 },
  loadingText: { color: L.textLight, fontSize: 14 },
  emptyText: { color: L.textMid, fontSize: 14, lineHeight: 20 },
  activityRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 12, backgroundColor: L.surface, borderRadius: 14, padding: 12, marginBottom: 8, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 4, elevation: 1 },
  activityDot: { width: 8, height: 8, borderRadius: 4, marginTop: 5 },
  activityAction: { color: L.dark, fontWeight: '700', fontSize: 14, textTransform: 'capitalize' },
  activityResult: { color: L.textMid, fontSize: 12, marginTop: 2, lineHeight: 17 },
  activityTime: { color: L.textLight, fontSize: 11, fontWeight: '600' },
  memCard: { backgroundColor: L.surface, borderRadius: 14, padding: 14, marginBottom: 8, borderLeftWidth: 3, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 4, elevation: 1 },
  memText: { color: L.dark, fontSize: 14, lineHeight: 20 },
  linkBtn: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 12 },
  linkBtnText: { color: L.violet, fontWeight: '700', fontSize: 14 },
});
