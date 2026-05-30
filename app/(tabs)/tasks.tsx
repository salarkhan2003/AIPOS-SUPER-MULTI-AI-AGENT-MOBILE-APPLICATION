import { Icon } from '@/components/Icon';
import { L } from '@/constants/light';
import { listAuditLogs } from '@/lib/audit';
import { router } from 'expo-router';
import { useEffect, useState } from 'react';
import { FlatList, Pressable, StatusBar, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

type Log = Awaited<ReturnType<typeof listAuditLogs>>[number];

const agentColor: Record<string, string> = {
  planner: L.violet,
  executor: L.coral,
  memory: L.mint,
  research: L.orange,
  verifier: L.yellow,
};

export default function TasksScreen() {
  const insets = useSafeAreaInsets();
  const [logs, setLogs] = useState<Log[]>([]);
  const [filter, setFilter] = useState<'all' | 'ghost' | 'ui'>('all');

  useEffect(() => { listAuditLogs(50).then(setLogs); }, []);

  const filtered = logs.filter((l) => {
    if (filter === 'ghost') return l.action.includes('ghost');
    if (filter === 'ui') return l.action.includes('ui_');
    return true;
  });

  return (
    <View style={[styles.root, { paddingTop: insets.top }]}>
      <StatusBar barStyle="dark-content" />

      <View style={styles.header}>
        <View>
          <Text style={styles.title}>Tasks</Text>
          <Text style={styles.subtitle}>{logs.length} executions logged</Text>
        </View>
        <Pressable style={styles.monitorBtn} onPress={() => router.push('/execution-monitor')}>
          <Icon name="activity" size={16} color={L.violet} />
          <Text style={styles.monitorText}>Monitor</Text>
        </Pressable>
      </View>

      {/* Filter pills */}
      <View style={styles.filters}>
        {(['all', 'ghost', 'ui'] as const).map((f) => (
          <Pressable
            key={f}
            style={[styles.filterPill, filter === f && styles.filterPillActive]}
            onPress={() => setFilter(f)}>
            <Text style={[styles.filterText, filter === f && styles.filterTextActive]}>
              {f === 'all' ? 'All' : f === 'ghost' ? 'Agent' : 'UI'}
            </Text>
          </Pressable>
        ))}
      </View>

      <FlatList
        data={filtered}
        keyExtractor={(l) => l.id}
        contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 120 }}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={
          <View style={styles.empty}>
            <Icon name="activity" size={32} color={L.textLight} />
            <Text style={styles.emptyText}>No tasks yet. Run a command from Home.</Text>
          </View>
        }
        renderItem={({ item }) => {
          const color = agentColor[item.agent ?? ''] ?? L.dark;
          return (
            <View style={styles.card}>
              <View style={[styles.agentDot, { backgroundColor: color }]} />
              <View style={{ flex: 1 }}>
                <View style={styles.cardTop}>
                  <Text style={[styles.agentLabel, { color }]}>{(item.agent ?? 'system').toUpperCase()}</Text>
                  <Text style={styles.time}>{new Date(item.timestamp).toLocaleTimeString()}</Text>
                </View>
                <Text style={styles.action}>{item.action}</Text>
                {item.result ? <Text style={styles.result} numberOfLines={2}>{item.result}</Text> : null}
              </View>
            </View>
          );
        }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: L.bg },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 20, paddingTop: 8, paddingBottom: 12 },
  title: { fontSize: 28, fontWeight: '800', color: L.dark, letterSpacing: -0.5 },
  subtitle: { color: L.textMid, fontSize: 13, marginTop: 2 },
  monitorBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    backgroundColor: 'rgba(91,79,232,0.10)',
    paddingHorizontal: 14, paddingVertical: 8, borderRadius: L.radius.pill,
  },
  monitorText: { color: L.violet, fontWeight: '700', fontSize: 13 },
  filters: { flexDirection: 'row', gap: 8, paddingHorizontal: 16, marginBottom: 12 },
  filterPill: {
    paddingHorizontal: 16, paddingVertical: 7, borderRadius: L.radius.pill,
    backgroundColor: L.surface, borderWidth: 1, borderColor: L.border,
  },
  filterPillActive: { backgroundColor: L.dark, borderColor: L.dark },
  filterText: { fontSize: 13, fontWeight: '600', color: L.textMid },
  filterTextActive: { color: '#fff' },
  card: {
    flexDirection: 'row', gap: 12,
    backgroundColor: L.surface, borderRadius: L.radius.lg,
    padding: 14, marginBottom: 10,
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06, shadowRadius: 8, elevation: 2,
  },
  agentDot: { width: 4, borderRadius: 2, alignSelf: 'stretch' },
  cardTop: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 4 },
  agentLabel: { fontSize: 10, fontWeight: '800', letterSpacing: 0.8 },
  time: { fontSize: 10, color: L.textLight },
  action: { color: L.dark, fontWeight: '600', fontSize: 14 },
  result: { color: L.textMid, fontSize: 12, marginTop: 4, lineHeight: 18 },
  empty: { alignItems: 'center', marginTop: 60, gap: 12 },
  emptyText: { color: L.textLight, fontSize: 14, textAlign: 'center' },
});
