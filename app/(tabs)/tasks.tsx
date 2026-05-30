import { useEffect, useState } from 'react';
import { View, Text, FlatList, Pressable, StyleSheet } from 'react-native';
import { router } from 'expo-router';
import { B } from '@/constants/basic';
import { listAuditLogs } from '@/lib/audit';

export default function TasksScreen() {
  const [logs, setLogs] = useState<Awaited<ReturnType<typeof listAuditLogs>>>([]);

  useEffect(() => {
    listAuditLogs(50).then(setLogs);
  }, []);

  return (
    <View style={s.root}>
      <Text style={s.h1}>Tasks / Executions</Text>
      <Pressable onPress={() => router.push('/execution-monitor')}><Text style={s.link}>Monitor →</Text></Pressable>
      <FlatList
        data={logs.filter((l) => l.action.includes('ghost') || l.action.includes('ui_') || l.action.includes('deep'))}
        keyExtractor={(l) => l.id}
        renderItem={({ item }) => (
          <View style={s.card}>
            <Text style={s.title}>{item.action}</Text>
            <Text style={s.sub}>{item.result}</Text>
          </View>
        )}
      />
    </View>
  );
}

const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: B.bg, padding: B.pad, paddingTop: 56 },
  h1: { color: B.text, fontSize: 24, fontWeight: '700' },
  link: { color: B.accent, marginVertical: 8 },
  card: { backgroundColor: B.card, padding: 12, borderRadius: B.radius, marginBottom: 8 },
  title: { color: B.text, fontWeight: '600' },
  sub: { color: B.dim, fontSize: 12, marginTop: 4 },
});
