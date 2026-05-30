import { useEffect, useState } from 'react';
import { View, Text, FlatList, Pressable, StyleSheet } from 'react-native';
import { router } from 'expo-router';
import { B } from '@/constants/basic';
import { ghostEvents, EVENTS } from '@/lib/events';
import { useGhostStore } from '@/store/ghostStore';
import type { ThoughtEvent } from '@/types';

export default function CommandCenterScreen() {
  const thoughts = useGhostStore((s) => s.thoughts);
  const addThought = useGhostStore((s) => s.addThought);
  const [, tick] = useState(0);

  useEffect(() => {
    const off = ghostEvents.on(EVENTS.THOUGHT, (t) => {
      addThought(t as ThoughtEvent);
      tick((n) => n + 1);
    });
    return off;
  }, [addThought]);

  return (
    <View style={s.root}>
      <Pressable onPress={() => router.back()}><Text style={s.back}>← Back</Text></Pressable>
      <Text style={s.h1}>Neural Log</Text>
      <FlatList
        data={thoughts}
        keyExtractor={(t) => t.id}
        renderItem={({ item }) => (
          <View style={s.card}>
            <Text style={s.agent}>{item.agent}</Text>
            <Text style={s.msg}>{item.message}</Text>
            {item.action && <Text style={s.act}>{item.action.action}</Text>}
          </View>
        )}
        ListEmptyComponent={<Text style={s.empty}>Run a command from Home or Voice</Text>}
      />
    </View>
  );
}

const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: B.bg, padding: B.pad, paddingTop: 48 },
  back: { color: B.accent, marginBottom: 8 },
  h1: { color: B.text, fontSize: 24, fontWeight: '700', marginBottom: 12 },
  card: { backgroundColor: B.card, padding: 12, borderRadius: B.radius, marginBottom: 8 },
  agent: { color: B.accent, fontSize: 10, fontWeight: '700' },
  msg: { color: B.text, marginTop: 4 },
  act: { color: B.dim, fontSize: 11, marginTop: 4 },
  empty: { color: B.dim, textAlign: 'center', marginTop: 40 },
});
