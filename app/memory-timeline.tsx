import { Icon } from '@/components/Icon';
import { L } from '@/constants/light';
import { listAuditLogs } from '@/lib/audit';
import { formatDisplayText } from '@/lib/displayText';
import type { AuditLogEntry } from '@/types';
import { router } from 'expo-router';
import { useEffect, useRef, useState } from 'react';
import {
    FlatList,
    Pressable,
    StatusBar,
    StyleSheet,
    Text,
    View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

const AGENT_COLORS: Record<string, string> = {
  planner: L.violet, executor: L.coral, memory: L.mint,
  research: L.orange, verifier: L.yellow, security: L.blue,
  communication: '#E040FB', workflow: '#00BCD4',
};

function formatTime(ts: number): string {
  return new Date(ts).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' });
}

function formatDate(ts: number): string {
  return new Date(ts).toLocaleDateString('en-IN', { weekday: 'short', day: 'numeric', month: 'short' });
}

export default function TimelineScreen() {
  const insets = useSafeAreaInsets();
  const [logs, setLogs] = useState<AuditLogEntry[]>([]);
  const [live, setLive] = useState(true);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const load = () => listAuditLogs(200).then(setLogs);

  useEffect(() => {
    load();
    if (live) {
      intervalRef.current = setInterval(load, 5000);
    }
    return () => { if (intervalRef.current) clearInterval(intervalRef.current); };
  }, [live]);

  // Group by date
  const grouped: { date: string; ts: number; items: AuditLogEntry[] }[] = [];
  for (const log of logs) {
    const d = formatDate(log.timestamp);
    const last = grouped[grouped.length - 1];
    if (last && last.date === d) {
      last.items.push(log);
    } else {
      grouped.push({ date: d, ts: log.timestamp, items: [log] });
    }
  }

  return (
    <View style={[styles.root, { paddingTop: insets.top }]}>
      <StatusBar barStyle="dark-content" />
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} style={styles.backBtn} hitSlop={12}>
          <Icon name="back" size={20} color={L.dark} />
        </Pressable>
        <View style={{ flex: 1 }}>
          <Text style={styles.title}>Timeline</Text>
          <Text style={styles.subtitle}>{logs.length} events recorded</Text>
        </View>
        <Pressable
          style={[styles.livePill, { backgroundColor: live ? 'rgba(62,207,178,0.12)' : L.bg }]}
          onPress={() => setLive((v) => !v)}>
          <View style={[styles.liveDot, { backgroundColor: live ? L.mint : L.textLight }]} />
          <Text style={[styles.liveText, { color: live ? L.mint : L.textLight }]}>
            {live ? 'LIVE' : 'PAUSED'}
          </Text>
        </Pressable>
      </View>

      <FlatList
        data={grouped}
        keyExtractor={(g) => g.date}
        contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 40 }}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={
          <View style={styles.empty}>
            <View style={styles.emptyIcon}>
              <Icon name="activity" size={28} color={L.textLight} />
            </View>
            <Text style={styles.emptyTitle}>No events yet</Text>
            <Text style={styles.emptyBody}>Your activity timeline will appear here as you use Ghost.</Text>
          </View>
        }
        renderItem={({ item: group }) => (
          <View>
            <View style={styles.dateRow}>
              <View style={styles.dateLine} />
              <View style={styles.dateBadge}>
                <Text style={styles.dateText}>{group.date}</Text>
              </View>
              <View style={styles.dateLine} />
            </View>
            {group.items.map((log, idx) => {
              const color = AGENT_COLORS[log.agent] ?? L.dark;
              const result = formatDisplayText(log.result ?? '');
              const isLast = idx === group.items.length - 1;
              return (
                <View key={log.id} style={styles.timelineRow}>
                  <View style={styles.lineCol}>
                    <View style={[styles.dot, { backgroundColor: color }]} />
                    {!isLast && <View style={styles.line} />}
                  </View>
                  <View style={[styles.card, { marginBottom: isLast ? 0 : 8 }]}>
                    <View style={styles.cardTop}>
                      <View style={[styles.agentBadge, { backgroundColor: color + '18' }]}>
                        <Text style={[styles.agentText, { color }]}>{log.agent.toUpperCase()}</Text>
                      </View>
                      <Text style={styles.timeText}>{formatTime(log.timestamp)}</Text>
                    </View>
                    <Text style={styles.actionText}>{log.action.replace(/_/g, ' ')}</Text>
                    {result ? <Text style={styles.resultText} numberOfLines={2}>{result}</Text> : null}
                  </View>
                </View>
              );
            })}
          </View>
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
  livePill: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 12, paddingVertical: 6, borderRadius: 20, borderWidth: 1, borderColor: L.border },
  liveDot: { width: 6, height: 6, borderRadius: 3 },
  liveText: { fontSize: 11, fontWeight: '800', letterSpacing: 0.8 },
  dateRow: { flexDirection: 'row', alignItems: 'center', gap: 10, marginVertical: 14 },
  dateLine: { flex: 1, height: 1, backgroundColor: L.border },
  dateBadge: { backgroundColor: L.surface, paddingHorizontal: 12, paddingVertical: 4, borderRadius: 12, borderWidth: 1, borderColor: L.border },
  dateText: { fontSize: 11, fontWeight: '700', color: L.textMid },
  timelineRow: { flexDirection: 'row', gap: 12 },
  lineCol: { alignItems: 'center', width: 20, paddingTop: 14 },
  dot: { width: 12, height: 12, borderRadius: 6 },
  line: { width: 2, flex: 1, backgroundColor: L.border, marginTop: 4 },
  card: { flex: 1, backgroundColor: L.surface, borderRadius: 16, padding: 14, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 6, elevation: 2 },
  cardTop: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 6 },
  agentBadge: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 8 },
  agentText: { fontSize: 9, fontWeight: '800', letterSpacing: 0.8 },
  timeText: { fontSize: 10, color: L.textLight, marginLeft: 'auto' },
  actionText: { color: L.dark, fontWeight: '700', fontSize: 14, textTransform: 'capitalize' },
  resultText: { color: L.textMid, fontSize: 12, marginTop: 4, lineHeight: 17 },
  empty: { alignItems: 'center', marginTop: 80, gap: 10 },
  emptyIcon: { width: 64, height: 64, borderRadius: 32, backgroundColor: L.surface, alignItems: 'center', justifyContent: 'center' },
  emptyTitle: { fontSize: 17, fontWeight: '800', color: L.dark },
  emptyBody: { color: L.textMid, fontSize: 14, textAlign: 'center', lineHeight: 20, paddingHorizontal: 32 },
});
