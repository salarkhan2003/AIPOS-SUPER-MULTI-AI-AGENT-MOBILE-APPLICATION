import { Icon } from '@/components/Icon';
import { L } from '@/constants/light';
import { listAuditLogs } from '@/lib/audit';
import { formatDisplayText } from '@/lib/displayText';
import { router } from 'expo-router';
import { useEffect, useRef, useState } from 'react';
import { FlatList, Pressable, StatusBar, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

type Log = Awaited<ReturnType<typeof listAuditLogs>>[number];

const AGENT_COLORS: Record<string, string> = {
  planner: L.violet, executor: L.coral, memory: L.mint,
  research: L.orange, verifier: L.yellow, security: L.blue,
  communication: '#E040FB', workflow: '#00BCD4',
};

export default function ExecutionMonitorScreen() {
  const insets = useSafeAreaInsets();
  const [logs, setLogs] = useState<Log[]>([]);
  const [live, setLive] = useState(true);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const load = () => listAuditLogs(30).then(setLogs);

  useEffect(() => {
    load();
    if (live) {
      intervalRef.current = setInterval(load, 3000);
    }
    return () => { if (intervalRef.current) clearInterval(intervalRef.current); };
  }, [live]);

  // Agent activity summary
  const agentCounts = logs.reduce<Record<string, number>>((acc, l) => {
    acc[l.agent] = (acc[l.agent] ?? 0) + 1;
    return acc;
  }, {});

  return (
    <View style={[styles.root, { paddingTop: insets.top }]}>
      <StatusBar barStyle="dark-content" />
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} style={styles.backBtn} hitSlop={12}>
          <Icon name="back" size={20} color={L.dark} />
        </Pressable>
        <View style={{ flex: 1 }}>
          <Text style={styles.title}>Execution Monitor</Text>
          <Text style={styles.subtitle}>Last {logs.length} executions</Text>
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

      {/* Agent activity bar */}
      {Object.keys(agentCounts).length > 0 && (
        <View style={styles.agentBar}>
          {Object.entries(agentCounts).map(([agent, count]) => (
            <View key={agent} style={styles.agentChip}>
              <View style={[styles.agentChipDot, { backgroundColor: AGENT_COLORS[agent] ?? L.dark }]} />
              <Text style={styles.agentChipText}>{agent}</Text>
              <Text style={[styles.agentChipCount, { color: AGENT_COLORS[agent] ?? L.dark }]}>{count}</Text>
            </View>
          ))}
        </View>
      )}

      <FlatList
        data={logs}
        keyExtractor={(l) => l.id}
        contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 40 }}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={
          <View style={styles.empty}>
            <View style={styles.emptyIcon}>
              <Icon name="zap" size={28} color={L.textLight} />
            </View>
            <Text style={styles.emptyTitle}>No executions yet</Text>
            <Text style={styles.emptyBody}>Run a command from Home or Voice to see live execution data.</Text>
          </View>
        }
        renderItem={({ item }) => {
          const color = AGENT_COLORS[item.agent] ?? L.dark;
          const result = formatDisplayText(item.result ?? '');
          return (
            <View style={styles.card}>
              <View style={[styles.agentBar2, { backgroundColor: color }]} />
              <View style={{ flex: 1 }}>
                <View style={styles.cardTop}>
                  <View style={[styles.agentBadge, { backgroundColor: color + '18' }]}>
                    <Text style={[styles.agentLabel, { color }]}>{item.agent.toUpperCase()}</Text>
                  </View>
                  <Text style={styles.timeText}>
                    {new Date(item.timestamp).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                  </Text>
                </View>
                <Text style={styles.actionText}>{item.action.replace(/_/g, ' ')}</Text>
                {result ? <Text style={styles.resultText} numberOfLines={2}>{result}</Text> : null}
                <View style={styles.riskRow}>
                  <Text style={styles.riskLabel}>Risk: {item.risk ?? 0}</Text>
                  <View style={[styles.approvedBadge, { backgroundColor: item.approved ? 'rgba(62,207,178,0.12)' : 'rgba(232,80,58,0.10)' }]}>
                    <Text style={[styles.approvedText, { color: item.approved ? L.mint : L.coral }]}>
                      {item.approved ? 'Approved' : 'Blocked'}
                    </Text>
                  </View>
                </View>
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
  header: { flexDirection: 'row', alignItems: 'center', gap: 14, paddingHorizontal: 16, paddingTop: 8, paddingBottom: 12 },
  backBtn: { width: 40, height: 40, borderRadius: 20, backgroundColor: L.surface, alignItems: 'center', justifyContent: 'center', shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.08, shadowRadius: 6, elevation: 2 },
  title: { fontSize: 22, fontWeight: '800', color: L.dark, letterSpacing: -0.5 },
  subtitle: { color: L.textMid, fontSize: 13 },
  livePill: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 12, paddingVertical: 6, borderRadius: 20, borderWidth: 1, borderColor: L.border },
  liveDot: { width: 6, height: 6, borderRadius: 3 },
  liveText: { fontSize: 11, fontWeight: '800', letterSpacing: 0.8 },
  agentBar: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, paddingHorizontal: 16, marginBottom: 12 },
  agentChip: { flexDirection: 'row', alignItems: 'center', gap: 5, backgroundColor: L.surface, paddingHorizontal: 10, paddingVertical: 5, borderRadius: 10, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.04, shadowRadius: 3, elevation: 1 },
  agentChipDot: { width: 6, height: 6, borderRadius: 3 },
  agentChipText: { fontSize: 11, fontWeight: '600', color: L.textMid },
  agentChipCount: { fontSize: 11, fontWeight: '800' },
  card: { flexDirection: 'row', gap: 12, backgroundColor: L.surface, borderRadius: 16, padding: 14, marginBottom: 10, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.06, shadowRadius: 8, elevation: 2 },
  agentBar2: { width: 4, borderRadius: 2, alignSelf: 'stretch' },
  cardTop: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 6 },
  agentBadge: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 8 },
  agentLabel: { fontSize: 10, fontWeight: '800', letterSpacing: 0.8 },
  timeText: { fontSize: 10, color: L.textLight, marginLeft: 'auto' },
  actionText: { color: L.dark, fontWeight: '700', fontSize: 14, textTransform: 'capitalize' },
  resultText: { color: L.textMid, fontSize: 12, marginTop: 4, lineHeight: 17 },
  riskRow: { flexDirection: 'row', alignItems: 'center', gap: 10, marginTop: 8 },
  riskLabel: { fontSize: 11, color: L.textLight, fontWeight: '600' },
  approvedBadge: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 8 },
  approvedText: { fontSize: 10, fontWeight: '800' },
  empty: { alignItems: 'center', marginTop: 80, gap: 10 },
  emptyIcon: { width: 64, height: 64, borderRadius: 32, backgroundColor: L.surface, alignItems: 'center', justifyContent: 'center' },
  emptyTitle: { fontSize: 17, fontWeight: '800', color: L.dark },
  emptyBody: { color: L.textMid, fontSize: 14, textAlign: 'center', lineHeight: 20, paddingHorizontal: 32 },
});
