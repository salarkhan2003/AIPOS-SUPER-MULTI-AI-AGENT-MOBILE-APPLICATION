import { Icon } from '@/components/Icon';
import { L } from '@/constants/light';
import { listAuditLogs } from '@/lib/audit';
import type { AuditLogEntry } from '@/types';
import { router } from 'expo-router';
import { useEffect, useState } from 'react';
import { FlatList, Pressable, StatusBar, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

export default function TimelineScreen() {
  const insets = useSafeAreaInsets();
  const [logs, setLogs] = useState<AuditLogEntry[]>([]);

  useEffect(() => {
    listAuditLogs(200).then(setLogs);
    const id = setInterval(() => listAuditLogs(200).then(setLogs), 5000);
    return () => clearInterval(id);
  }, []);

  return (
    <View style={[styles.root, { paddingTop: insets.top }]}>
      <StatusBar barStyle="dark-content" />
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} style={styles.backBtn} hitSlop={12}>
          <Icon name="back" size={20} color={L.dark} />
        </Pressable>
        <View>
          <Text style={styles.title}>Timeline</Text>
          <Text style={styles.subtitle}>Live · refreshes every 5s</Text>
        </View>
        <View style={styles.liveDot} />
      </View>

      <FlatList
        data={logs}
        keyExtractor={(l) => l.id}
        contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 40 }}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={
          <View style={styles.empty}>
            <Icon name="activity" size={32} color={L.textLight} />
            <Text style={styles.emptyText}>No events yet</Text>
          </View>
        }
        renderItem={({ item, index }) => (
          <View style={styles.timelineRow}>
            {/* Timeline line */}
            <View style={styles.lineCol}>
              <View style={styles.dot} />
              {index < logs.length - 1 && <View style={styles.line} />}
            </View>
            <View style={styles.card}>
              <Text style={styles.time}>{new Date(item.timestamp).toLocaleString('en-IN')}</Text>
              <Text style={styles.action}>{item.action}</Text>
              {item.result ? <Text style={styles.result} numberOfLines={2}>{item.result}</Text> : null}
            </View>
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
  subtitle: { color: L.textMid, fontSize: 13, flex: 1 },
  liveDot: { width: 10, height: 10, borderRadius: 5, backgroundColor: L.mint },
  timelineRow: { flexDirection: 'row', gap: 12, marginBottom: 0 },
  lineCol: { alignItems: 'center', width: 20 },
  dot: { width: 12, height: 12, borderRadius: 6, backgroundColor: L.violet, marginTop: 16 },
  line: { width: 2, flex: 1, backgroundColor: L.border, marginTop: 4 },
  card: { flex: 1, backgroundColor: L.surface, borderRadius: L.radius.lg, padding: 14, marginBottom: 10, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.06, shadowRadius: 8, elevation: 2 },
  time: { color: L.textLight, fontSize: 11, fontWeight: '600', marginBottom: 4 },
  action: { color: L.dark, fontWeight: '700', fontSize: 14 },
  result: { color: L.textMid, fontSize: 12, marginTop: 4, lineHeight: 18 },
  empty: { alignItems: 'center', marginTop: 80, gap: 12 },
  emptyText: { color: L.textLight, fontSize: 14 },
});
