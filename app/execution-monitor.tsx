import { Icon } from '@/components/Icon';
import { L } from '@/constants/light';
import { listAuditLogs } from '@/lib/audit';
import { router } from 'expo-router';
import { useEffect, useState } from 'react';
import { FlatList, Pressable, StatusBar, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

type Log = Awaited<ReturnType<typeof listAuditLogs>>[number];

const agentColor: Record<string, string> = {
  planner: L.violet, executor: L.coral, memory: L.mint,
  research: L.orange, verifier: L.yellow, security: L.blue,
};

export default function ExecutionMonitorScreen() {
  const insets = useSafeAreaInsets();
  const [logs, setLogs] = useState<Log[]>([]);

  useEffect(() => {
    listAuditLogs(30).then(setLogs);
    const id = setInterval(() => listAuditLogs(30).then(setLogs), 3000);
    return () => clearInterval(id);
  }, []);

  return (
    <View style={[styles.root, { paddingTop: insets.top }]}>
      <StatusBar barStyle="dark-content" />
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} style={styles.backBtn} hitSlop={12}>
          <Icon name="back" size={20} color={L.dark} />
        </Pressable>
        <View style={{ flex: 1 }}>
          <Text style={styles.title}>Execution Monitor</Text>
          <Text style={styles.subtitle}>Live · refreshes every 3s</Text>
        </View>
        <View style={styles.livePill}>
          <View style={styles.liveDot} />
          <Text style={styles.liveText}>LIVE</Text>
        </View>
      </View>

      <FlatList
        data={logs}
        keyExtractor={(l) => l.id}
        contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 40 }}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={
          <View style={styles.empty}>
            <Icon name="zap" size={32} color={L.textLight} />
            <Text style={styles.emptyText}>No executions yet</Text>
          </View>
        }
        renderItem={({ item }) => {
          const color = agentColor[item.agent ?? ''] ?? L.dark;
          return (
            <View style={styles.card}>
              <View style={[styles.agentBar, { backgroundColor: color }]} />
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
  header: { flexDirection: 'row', alignItems: 'center', gap: 14, paddingHorizontal: 16, paddingTop: 8, paddingBottom: 16 },
  backBtn: { width: 40, height: 40, borderRadius: 20, backgroundColor: L.surface, alignItems: 'center', justifyContent: 'center', shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.08, shadowRadius: 6, elevation: 2 },
  title: { fontSize: 24, fontWeight: '800', color: L.dark, letterSpacing: -0.5 },
  subtitle: { color: L.textMid, fontSize: 13 },
  livePill: { flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: 'rgba(62,207,178,0.12)', paddingHorizontal: 10, paddingVertical: 5, borderRadius: L.radius.pill },
  liveDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: L.mint },
  liveText: { color: L.mint, fontSize: 11, fontWeight: '800', letterSpacing: 0.8 },
  card: { flexDirection: 'row', gap: 12, backgroundColor: L.surface, borderRadius: L.radius.lg, padding: 14, marginBottom: 10, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.06, shadowRadius: 8, elevation: 2 },
  agentBar: { width: 4, borderRadius: 2, alignSelf: 'stretch' },
  cardTop: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 4 },
  agentLabel: { fontSize: 10, fontWeight: '800', letterSpacing: 0.8 },
  time: { fontSize: 10, color: L.textLight },
  action: { color: L.dark, fontWeight: '600', fontSize: 14 },
  result: { color: L.textMid, fontSize: 12, marginTop: 4, lineHeight: 18 },
  empty: { alignItems: 'center', marginTop: 80, gap: 12 },
  emptyText: { color: L.textLight, fontSize: 14 },
});
