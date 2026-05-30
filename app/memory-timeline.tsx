import { useEffect, useState } from 'react';
import { View, Text, FlatList, Pressable, StyleSheet } from 'react-native';
import { router } from 'expo-router';
import { B } from '@/constants/basic';
import { listAuditLogs } from '@/lib/audit';
import type { AuditLogEntry } from '@/types';

export default function TimelineScreen() {
  const [logs, setLogs] = useState<AuditLogEntry[]>([]);

  useEffect(() => {
    listAuditLogs(200).then(setLogs);
    const id = setInterval(() => listAuditLogs(200).then(setLogs), 5000);
    return () => clearInterval(id);
  }, []);

  return (
    <View style={s.root}>
      <Pressable onPress={() => router.back()}><Text style={s.back}>← Back</Text></Pressable>
      <Text style={s.h1}>Timeline (Audit)</Text>
      <FlatList
        data={logs}
        keyExtractor={(l) => l.id}
        renderItem={({ item }) => (
          <View style={s.card}>
            <Text style={s.time}>{new Date(item.timestamp).toLocaleString('en-IN')}</Text>
            <Text style={s.action}>{item.action}</Text>
            <Text style={s.result}>{item.result}</Text>
          </View>
        )}
      />
    </View>
  );
}

const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: B.bg, padding: B.pad, paddingTop: 48 },
  back: { color: B.accent },
  h1: { color: B.text, fontSize: 24, fontWeight: '700', marginVertical: 12 },
  card: { backgroundColor: B.card, padding: 12, borderRadius: B.radius, marginBottom: 8 },
  time: { color: B.dim, fontSize: 11 },
  action: { color: B.text, fontWeight: '600', marginTop: 4 },
  result: { color: B.dim, fontSize: 12, marginTop: 4 },
});
