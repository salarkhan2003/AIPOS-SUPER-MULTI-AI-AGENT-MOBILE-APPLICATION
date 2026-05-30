import { Icon } from '@/components/Icon';
import { L } from '@/constants/light';
import { memory } from '@/lib/memory';
import type { MemoryRecord } from '@/types';
import { router } from 'expo-router';
import { useEffect, useState } from 'react';
import { Pressable, ScrollView, StatusBar, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

const typeColor: Record<string, string> = {
  semantic: L.violet,
  episodic: L.coral,
  procedural: L.mint,
};

export default function KnowledgeGraphScreen() {
  const insets = useSafeAreaInsets();
  const [items, setItems] = useState<MemoryRecord[]>([]);
  const [selected, setSelected] = useState<string | null>(null);

  useEffect(() => { memory.list(100).then(setItems); }, []);

  const grouped = items.reduce<Record<string, MemoryRecord[]>>((acc, item) => {
    const key = item.type ?? 'other';
    if (!acc[key]) acc[key] = [];
    acc[key].push(item);
    return acc;
  }, {});

  return (
    <View style={[styles.root, { paddingTop: insets.top }]}>
      <StatusBar barStyle="dark-content" />
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} style={styles.backBtn} hitSlop={12}>
          <Icon name="back" size={20} color={L.dark} />
        </Pressable>
        <View>
          <Text style={styles.title}>Knowledge Graph</Text>
          <Text style={styles.subtitle}>{items.length} nodes</Text>
        </View>
      </View>

      {/* Stats row */}
      <View style={styles.statsRow}>
        {Object.entries(grouped).map(([type, nodes]) => (
          <Pressable
            key={type}
            style={[styles.statCard, { borderColor: typeColor[type] ?? L.dark, borderWidth: selected === type ? 2 : 1 }]}
            onPress={() => setSelected(selected === type ? null : type)}>
            <Text style={[styles.statNum, { color: typeColor[type] ?? L.dark }]}>{nodes.length}</Text>
            <Text style={styles.statLabel}>{type}</Text>
          </Pressable>
        ))}
      </View>

      <ScrollView contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 40 }} showsVerticalScrollIndicator={false}>
        {Object.entries(grouped)
          .filter(([type]) => !selected || selected === type)
          .map(([type, nodes]) => (
            <View key={type} style={styles.group}>
              <View style={styles.groupHeader}>
                <View style={[styles.groupDot, { backgroundColor: typeColor[type] ?? L.dark }]} />
                <Text style={styles.groupTitle}>{type.toUpperCase()}</Text>
                <Text style={styles.groupCount}>{nodes.length}</Text>
              </View>
              {nodes.slice(0, 5).map((node) => (
                <View key={node.id} style={styles.node}>
                  <Text style={styles.nodeText} numberOfLines={2}>{node.text}</Text>
                </View>
              ))}
              {nodes.length > 5 && (
                <Text style={styles.more}>+{nodes.length - 5} more nodes</Text>
              )}
            </View>
          ))}
        {items.length === 0 && (
          <View style={styles.empty}>
            <Icon name="brain" size={36} color={L.textLight} />
            <Text style={styles.emptyText}>No memory nodes yet.{'\n'}Add memories from the Memory tab.</Text>
          </View>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: L.bg },
  header: { flexDirection: 'row', alignItems: 'center', gap: 14, paddingHorizontal: 16, paddingTop: 8, paddingBottom: 12 },
  backBtn: { width: 40, height: 40, borderRadius: 20, backgroundColor: L.surface, alignItems: 'center', justifyContent: 'center', shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.08, shadowRadius: 6, elevation: 2 },
  title: { fontSize: 24, fontWeight: '800', color: L.dark, letterSpacing: -0.5 },
  subtitle: { color: L.textMid, fontSize: 13 },
  statsRow: { flexDirection: 'row', gap: 10, paddingHorizontal: 16, marginBottom: 16 },
  statCard: { flex: 1, backgroundColor: L.surface, borderRadius: L.radius.md, padding: 14, alignItems: 'center', shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.06, shadowRadius: 8, elevation: 2 },
  statNum: { fontSize: 24, fontWeight: '800' },
  statLabel: { fontSize: 11, color: L.textLight, marginTop: 2, fontWeight: '600' },
  group: { marginBottom: 20 },
  groupHeader: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 10 },
  groupDot: { width: 10, height: 10, borderRadius: 5 },
  groupTitle: { fontSize: 12, fontWeight: '800', color: L.dark, letterSpacing: 0.8, flex: 1 },
  groupCount: { fontSize: 12, color: L.textLight, fontWeight: '600' },
  node: { backgroundColor: L.surface, borderRadius: L.radius.md, padding: 12, marginBottom: 8, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 4, elevation: 1 },
  nodeText: { color: L.dark, fontSize: 13, lineHeight: 18 },
  more: { color: L.textLight, fontSize: 12, fontWeight: '600', paddingLeft: 4 },
  empty: { alignItems: 'center', marginTop: 80, gap: 12 },
  emptyText: { color: L.textLight, fontSize: 14, textAlign: 'center', lineHeight: 22 },
});
