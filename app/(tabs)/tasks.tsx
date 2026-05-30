import { Icon } from '@/components/Icon';
import { useTheme } from '@/lib/themeContext';
import { listAuditLogs } from '@/lib/audit';
import { formatDisplayText } from '@/lib/displayText';
import { notifyLocal } from '@/lib/notifications-local';
import { router } from 'expo-router';
import { useEffect, useMemo, useState } from 'react';
import {
    FlatList,
    Pressable,
    StatusBar,
    StyleSheet,
    Text,
    View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

type Log = Awaited<ReturnType<typeof listAuditLogs>>[number];
type Filter = 'all' | 'agent' | 'ui' | 'memory';

function agentColors(C: ReturnType<typeof useTheme>['colors']): Record<string, string> {
  return {
    planner: C.violet,
    executor: C.coral,
    memory: C.mint,
    research: C.orange,
    verifier: C.yellow,
    security: C.blue,
    communication: '#E040FB',
    workflow: '#00BCD4',
  };
}

const AGENT_ICONS: Record<string, 'brain' | 'zap' | 'memory' | 'search' | 'check' | 'shield' | 'mail' | 'git-branch'> = {
  planner: 'brain',
  executor: 'zap',
  memory: 'memory',
  research: 'search',
  verifier: 'check',
  security: 'shield',
  communication: 'mail',
  workflow: 'git-branch',
};

function riskLabel(risk: number, C: ReturnType<typeof useTheme>['colors']): { label: string; color: string; bg: string } {
  if (risk >= 15) return { label: 'HIGH', color: C.coral, bg: C.coral + '1A' };
  if (risk >= 8) return { label: 'MED', color: C.orange, bg: C.orange + '1A' };
  return { label: 'LOW', color: C.mint, bg: C.mint + '1A' };
}

export default function TasksScreen() {
  const insets = useSafeAreaInsets();
  const { colors: C, isDark } = useTheme();
  const styles = useMemo(() => makeStyles(C), [C]);
  const AGENT_COLORS = useMemo(() => agentColors(C), [C]);
  const [logs, setLogs] = useState<Log[]>([]);
  const [filter, setFilter] = useState<Filter>('all');
  const [refreshing, setRefreshing] = useState(false);

  const load = async () => {
    setRefreshing(true);
    const data = await listAuditLogs(60);
    setLogs(data);
    setRefreshing(false);
  };

  useEffect(() => { load(); }, []);

  const filtered = logs.filter((l) => {
    if (filter === 'agent') return ['planner', 'executor', 'research', 'verifier'].includes(l.agent);
    if (filter === 'ui') return l.action.startsWith('ui_') || l.action.includes('deep_link');
    if (filter === 'memory') return l.agent === 'memory' || l.action.includes('memory');
    return true;
  });

  const stats = {
    total: logs.length,
    completed: logs.filter((l) => l.approved === 1).length,
    highRisk: logs.filter((l) => l.risk >= 15).length,
  };

  return (
    <View style={[styles.root, { paddingTop: insets.top }]}>
      <StatusBar barStyle={isDark ? 'light-content' : 'dark-content'} />

      {/* Header */}
      <View style={styles.header}>
        <View>
          <Text style={styles.title}>Tasks</Text>
          <Text style={styles.subtitle}>{stats.total} executions logged</Text>
        </View>
        <Pressable style={styles.monitorBtn} onPress={() => router.push('/execution-monitor')}>
          <Icon name="activity" size={15} color={C.violet} />
          <Text style={styles.monitorText}>Live</Text>
        </Pressable>
      </View>

      {/* Stats row */}
      <View style={styles.statsRow}>
        <View style={[styles.statCard, { backgroundColor: C.violet }]}>
          <Text style={styles.statNum}>{stats.total}</Text>
          <Text style={styles.statLabel}>Total</Text>
        </View>
        <View style={[styles.statCard, { backgroundColor: C.mint }]}>
          <Text style={styles.statNum}>{stats.completed}</Text>
          <Text style={styles.statLabel}>Done</Text>
        </View>
        <View style={[styles.statCard, { backgroundColor: C.coral }]}>
          <Text style={styles.statNum}>{stats.highRisk}</Text>
          <Text style={styles.statLabel}>High risk</Text>
        </View>
      </View>

      {/* Filters */}
      <View style={styles.filters}>
        {(['all', 'agent', 'ui', 'memory'] as Filter[]).map((f) => (
          <Pressable
            key={f}
            style={[styles.filterPill, filter === f && styles.filterPillActive]}
            onPress={() => setFilter(f)}>
            <Text style={[styles.filterText, filter === f && styles.filterTextActive]}>
              {f.charAt(0).toUpperCase() + f.slice(1)}
            </Text>
          </Pressable>
        ))}
      </View>

      <FlatList
        data={filtered}
        keyExtractor={(l) => l.id}
        contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 120 }}
        showsVerticalScrollIndicator={false}
        onRefresh={load}
        refreshing={refreshing}
        ListEmptyComponent={
          <View style={styles.empty}>
            <View style={styles.emptyIcon}>
              <Icon name="activity" size={28} color={C.textLight} />
            </View>
            <Text style={styles.emptyTitle}>No tasks yet</Text>
            <Text style={styles.emptyBody}>Run a command from Home or Voice to see executions here.</Text>
            <Pressable style={styles.emptyBtn} onPress={() => router.push('/')}>
              <Text style={styles.emptyBtnText}>Go to Home</Text>
            </Pressable>
          </View>
        }
        renderItem={({ item }) => {
          const color = AGENT_COLORS[item.agent] ?? C.dark;
          const icon = AGENT_ICONS[item.agent] ?? 'zap';
          const risk = riskLabel(item.risk ?? 0, C);
          const result = formatDisplayText(item.result ?? '');
          return (
            <Pressable
              style={styles.card}
              onPress={() => notifyLocal('Task detail', result || item.action, {}, 'task')}>
              <View style={[styles.agentIconWrap, { backgroundColor: color + '18' }]}>
                <Icon name={icon} size={18} color={color} />
              </View>
              <View style={{ flex: 1 }}>
                <View style={styles.cardTop}>
                  <Text style={[styles.agentLabel, { color }]}>{item.agent.toUpperCase()}</Text>
                  <View style={[styles.riskBadge, { backgroundColor: risk.bg }]}>
                    <Text style={[styles.riskText, { color: risk.color }]}>{risk.label}</Text>
                  </View>
                  <Text style={styles.timeText}>
                    {new Date(item.timestamp).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}
                  </Text>
                </View>
                <Text style={styles.actionText}>{item.action.replace(/_/g, ' ')}</Text>
                {result ? (
                  <Text style={styles.resultText} numberOfLines={2}>{result}</Text>
                ) : null}
              </View>
            </Pressable>
          );
        }}
      />
    </View>
  );
}

function makeStyles(C: ReturnType<typeof useTheme>['colors']) {
  return StyleSheet.create({
  root: { flex: 1, backgroundColor: C.bg },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 20, paddingTop: 8, paddingBottom: 10 },
  title: { fontSize: 28, fontWeight: '800', color: C.text, letterSpacing: -0.5 },
  subtitle: { color: C.textMid, fontSize: 13, marginTop: 2 },
  monitorBtn: { flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: 'rgba(91,79,232,0.10)', paddingHorizontal: 14, paddingVertical: 8, borderRadius: 20 },
  monitorText: { color: C.violet, fontWeight: '700', fontSize: 13 },
  statsRow: { flexDirection: 'row', gap: 10, paddingHorizontal: 16, marginBottom: 12 },
  statCard: { flex: 1, borderRadius: 16, padding: 14, alignItems: 'center' },
  statNum: { color: '#fff', fontSize: 22, fontWeight: '800' },
  statLabel: { color: 'rgba(255,255,255,0.7)', fontSize: 11, marginTop: 2, fontWeight: '600' },
  filters: { flexDirection: 'row', gap: 8, paddingHorizontal: 16, marginBottom: 12 },
  filterPill: { paddingHorizontal: 14, paddingVertical: 7, borderRadius: 20, backgroundColor: C.surface, borderWidth: 1, borderColor: C.border },
  filterPillActive: { backgroundColor: C.ink, borderColor: C.ink },
  filterText: { fontSize: 13, fontWeight: '600', color: C.textMid },
  filterTextActive: { color: '#fff' },
  card: { flexDirection: 'row', gap: 12, backgroundColor: C.surface, borderRadius: 18, padding: 14, marginBottom: 10, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.06, shadowRadius: 8, elevation: 2 },
  agentIconWrap: { width: 44, height: 44, borderRadius: 22, alignItems: 'center', justifyContent: 'center' },
  cardTop: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 4 },
  agentLabel: { fontSize: 10, fontWeight: '800', letterSpacing: 0.8 },
  riskBadge: { paddingHorizontal: 7, paddingVertical: 2, borderRadius: 6 },
  riskText: { fontSize: 9, fontWeight: '800', letterSpacing: 0.5 },
  timeText: { fontSize: 10, color: C.textLight, marginLeft: 'auto' },
  actionText: { color: C.text, fontWeight: '700', fontSize: 14, textTransform: 'capitalize' },
  resultText: { color: C.textMid, fontSize: 12, marginTop: 4, lineHeight: 17 },
  empty: { alignItems: 'center', marginTop: 60, gap: 10, paddingHorizontal: 32 },
  emptyIcon: { width: 64, height: 64, borderRadius: 32, backgroundColor: C.surface, alignItems: 'center', justifyContent: 'center' },
  emptyTitle: { fontSize: 17, fontWeight: '800', color: C.text },
  emptyBody: { color: C.textMid, fontSize: 14, textAlign: 'center', lineHeight: 20 },
  emptyBtn: { backgroundColor: C.ink, paddingHorizontal: 24, paddingVertical: 12, borderRadius: 20, marginTop: 4 },
  emptyBtnText: { color: '#fff', fontWeight: '700', fontSize: 14 },
  });
}
