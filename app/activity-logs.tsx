import { Icon } from '@/components/Icon';
import { L } from '@/constants/light';
import { listAuditLogs } from '@/lib/audit';
import { formatDisplayText } from '@/lib/displayText';
import { router } from 'expo-router';
import { useEffect, useState } from 'react';
import { FlatList, Pressable, StatusBar, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

type Log = Awaited<ReturnType<typeof listAuditLogs>>[number];

const AGENT_COLORS: Record<string, string> = {
  planner: L.violet, executor: L.coral, memory: L.mint,
  research: L.orange, verifier: L.yellow, security: L.blue,
  communication: '#E040FB', workflow: '#00BCD4',
};

function groupByDate(logs: Log[]): { date: string; items: Log[] }[] {
  const map = new Map<string, Log[]>();
  for (const log of logs) {
    const d = new Date(log.timestamp).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
    if (!map.has(d)) map.set(d, []);
    map.get(d)!.push(log);
  }
  return Array.from(map.entries()).map(([date, items]) => ({ date, items }));
}

export default function ActivityLogsScreen() {
  const insets = useSafeAreaInsets();
  const [logs, setLogs] = useState<Log[]>([]);
  const [refreshing, setRefreshing] = useState(false);

  const load = async () => {
    setRefreshing(true);
    setLogs(await listAuditLogs(100));
    setRefreshing(false);
  };

  useEffect(() => { load(); }, []);

  const groups = groupByDate(logs);

  return (
    <View style={[styles.root, { paddingTop: insets.top }]}>
      <StatusBar barStyle="dark-content" />
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} style={styles.backBtn} hitSlop={12}>
          <Icon name="back" size={20} color={L.dark} />
        </Pressable>
        <View>
          <Text style={styles.title}>Audit Trail</Text>
          <Text style={styles.subtitle}>{logs.length} entries</Text>
        </View>
      </View>

      <FlatList
        data={groups}
        keyExtractor={(g) => g.date}
        contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 40 }}
        showsVerticalScrollIndicator={false}
        onRefresh={load}
        refreshing={refreshing}
        ListEmptyComponent={
          <View style={styles.empty}>
            <Icon name="list" size={32} color={L.textLight} />
            <Text style={styles.emptyTitle}>No activity yet</Text>
            <Text style={styles.emptyBody}>Run commands from Home or Voice to build your audit trail.</Text>
          </View>
        }
        renderItem={({ item: group }) => (
          <View>
            <Text style={styles.dateLabel}>{group.date}</Text>
            {group.items.map((log) => {
              const color = AGENT_COLORS[log.agent] ?? L.dark;
              const result = formatDisplayText(log.result ?? '');
              return (
                <View key={log.id} style={styles.card}>
                  <View style={[styles.agentDot, { backgroundColor: color }]} />
                  <View style={{ flex: 1 }}>
                    <View style={styles.cardTop}>
                      <Text style={[styles.agentText, { color }]}>{log.agent.toUpperCase()}</Text>
                      <Text style={styles.timeText}>
                        {new Date(log.timestamp).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}
                      </Text>
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
  header: { flexDirection: 'row', alignItems: 'center', gap: 14, paddingHorizontal: 16, paddingTop: 8, paddingBottom: 16 },
  backBtn: { width: 40, height: 40, borderRadius: 20, backgroundColor: L.surface, alignItems: 'center', justifyContent: 'center', shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.08, shadowRadius: 6, elevation: 2 },
  title: { fontSize: 24, fontWeight: '800', color: L.dark, letterSpacing: -0.5 },
  subtitle: { color: L.textMid, fontSize: 13 },
  dateLabel: { fontSize: 11, fontWeight: '800', color: L.textLight, letterSpacing: 1, marginBottom: 8, marginTop: 4 },
  card: { flexDirection: 'row', gap: 12, backgroundColor: L.surface, borderRadius: 16, padding: 14, marginBottom: 8, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 6, elevation: 2 },
  agentDot: { width: 4, borderRadius: 2, alignSelf: 'stretch' },
  cardTop: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 4 },
  agentText: { fontSize: 10, fontWeight: '800', letterSpacing: 0.8 },
  timeText: { fontSize: 10, color: L.textLight },
  actionText: { color: L.dark, fontWeight: '700', fontSize: 14, textTransform: 'capitalize' },
  resultText: { color: L.textMid, fontSize: 12, marginTop: 3, lineHeight: 17 },
  empty: { alignItems: 'center', marginTop: 80, gap: 10 },
  emptyTitle: { fontSize: 17, fontWeight: '800', color: L.dark },
  emptyBody: { color: L.textMid, fontSize: 14, textAlign: 'center', lineHeight: 20, paddingHorizontal: 32 },
});
