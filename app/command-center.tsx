import { Icon } from '@/components/Icon';
import { L } from '@/constants/light';
import { EVENTS, ghostEvents } from '@/lib/events';
import { useGhostStore } from '@/store/ghostStore';
import type { ThoughtEvent } from '@/types';
import { router } from 'expo-router';
import { useEffect } from 'react';
import { FlatList, Pressable, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

const agentColor: Record<string, string> = {
  planner: L.violet, executor: L.coral, memory: L.mint,
  research: L.orange, verifier: L.yellow, security: L.blue,
};

export default function CommandCenterScreen() {
  const insets = useSafeAreaInsets();
  const thoughts = useGhostStore((s) => s.thoughts);
  const addThought = useGhostStore((s) => s.addThought);

  useEffect(() => {
    return ghostEvents.on(EVENTS.THOUGHT, (t) => addThought(t as ThoughtEvent));
  }, [addThought]);

  return (
    <View style={[styles.root, { paddingTop: insets.top }]}>
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} style={styles.backBtn} hitSlop={12}>
          <Icon name="back" size={20} color={L.dark} />
        </Pressable>
        <View>
          <Text style={styles.title}>Neural Log</Text>
          <Text style={styles.subtitle}>{thoughts.length} thoughts recorded</Text>
        </View>
      </View>

      <FlatList
        data={thoughts}
        keyExtractor={(t) => t.id}
        contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 40 }}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={
          <View style={styles.empty}>
            <Icon name="network" size={36} color={L.textLight} />
            <Text style={styles.emptyText}>Run a command from Home or Voice</Text>
          </View>
        }
        renderItem={({ item }) => {
          const color = agentColor[item.agent] ?? L.dark;
          return (
            <View style={styles.card}>
              <View style={[styles.agentBar, { backgroundColor: color }]} />
              <View style={{ flex: 1 }}>
                <Text style={[styles.agent, { color }]}>{item.agent.toUpperCase()}</Text>
                <Text style={styles.msg}>{item.message}</Text>
                {item.action && (
                  <View style={styles.actionPill}>
                    <Text style={styles.actionText}>{item.action.action}</Text>
                  </View>
                )}
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
  card: { flexDirection: 'row', gap: 12, backgroundColor: L.surface, borderRadius: L.radius.lg, padding: 14, marginBottom: 10, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.06, shadowRadius: 8, elevation: 2 },
  agentBar: { width: 4, borderRadius: 2, alignSelf: 'stretch' },
  agent: { fontSize: 10, fontWeight: '800', letterSpacing: 0.8, marginBottom: 4 },
  msg: { color: L.dark, fontSize: 14, lineHeight: 20 },
  actionPill: { marginTop: 8, alignSelf: 'flex-start', backgroundColor: L.bg, borderRadius: 8, paddingHorizontal: 8, paddingVertical: 3 },
  actionText: { color: L.textMid, fontSize: 11, fontWeight: '600' },
  empty: { alignItems: 'center', marginTop: 80, gap: 12 },
  emptyText: { color: L.textLight, fontSize: 14, textAlign: 'center' },
});
