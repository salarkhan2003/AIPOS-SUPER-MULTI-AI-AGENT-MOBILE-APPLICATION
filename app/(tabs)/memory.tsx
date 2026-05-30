import { ClayInput } from '@/components/clay';
import { Icon } from '@/components/Icon';
import { L } from '@/constants/light';
import { memory } from '@/lib/memory';
import type { MemoryRecord } from '@/types';
import { router } from 'expo-router';
import { useEffect, useState } from 'react';
import { FlatList, Pressable, StatusBar, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

const typeColor: Record<string, string> = {
  semantic: L.violet,
  episodic: L.coral,
  procedural: L.mint,
};

export default function MemoryScreen() {
  const insets = useSafeAreaInsets();
  const [items, setItems] = useState<MemoryRecord[]>([]);
  const [query, setQuery] = useState('');
  const [input, setInput] = useState('');

  const refresh = async () => {
    setItems(query.trim() ? await memory.search(query, 20) : await memory.list(50));
  };

  useEffect(() => { refresh(); }, [query]);

  const add = async () => {
    if (!input.trim()) return;
    await memory.add(input.trim(), 'semantic');
    setInput('');
    refresh();
  };

  return (
    <View style={[styles.root, { paddingTop: insets.top }]}>
      <StatusBar barStyle="dark-content" />

      <View style={styles.header}>
        <View>
          <Text style={styles.title}>Memory</Text>
          <Text style={styles.subtitle}>{items.length} records stored</Text>
        </View>
        <Pressable style={styles.graphBtn} onPress={() => router.push('/knowledge-graph')}>
          <Icon name="brain" size={16} color={L.coral} />
          <Text style={styles.graphText}>Graph</Text>
        </Pressable>
      </View>

      <View style={styles.inputArea}>
        <ClayInput placeholder="Search memories…" value={query} onChangeText={setQuery} />
        <View style={styles.addRow}>
          <View style={{ flex: 1 }}>
            <ClayInput placeholder="Add new memory…" value={input} onChangeText={setInput} />
          </View>
          <Pressable style={styles.addBtn} onPress={add}>
            <Icon name="check" size={20} color="#fff" />
          </Pressable>
        </View>
      </View>

      <FlatList
        data={items}
        keyExtractor={(i) => i.id}
        contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 120 }}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={
          <View style={styles.empty}>
            <Icon name="memory" size={32} color={L.textLight} />
            <Text style={styles.emptyText}>No memories yet. Add one above.</Text>
          </View>
        }
        renderItem={({ item }) => {
          const color = typeColor[item.type] ?? L.dark;
          return (
            <View style={styles.card}>
              <View style={[styles.typeBadge, { backgroundColor: color + '18' }]}>
                <Text style={[styles.typeText, { color }]}>{item.type.toUpperCase()}</Text>
              </View>
              <Text style={styles.memText}>{item.text}</Text>
            </View>
          );
        }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: L.bg },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 20, paddingTop: 8, paddingBottom: 8 },
  title: { fontSize: 28, fontWeight: '800', color: L.dark, letterSpacing: -0.5 },
  subtitle: { color: L.textMid, fontSize: 13, marginTop: 2 },
  graphBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    backgroundColor: 'rgba(232,80,58,0.10)',
    paddingHorizontal: 14, paddingVertical: 8, borderRadius: L.radius.pill,
  },
  graphText: { color: L.coral, fontWeight: '700', fontSize: 13 },
  inputArea: { paddingHorizontal: 16, paddingBottom: 4 },
  addRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 10 },
  addBtn: {
    width: 48, height: 48, borderRadius: 24,
    backgroundColor: L.mint, alignItems: 'center', justifyContent: 'center',
    marginTop: 0,
  },
  card: {
    backgroundColor: L.surface, borderRadius: L.radius.lg,
    padding: 14, marginBottom: 10,
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06, shadowRadius: 8, elevation: 2,
  },
  typeBadge: { alignSelf: 'flex-start', borderRadius: 8, paddingHorizontal: 8, paddingVertical: 3, marginBottom: 8 },
  typeText: { fontSize: 10, fontWeight: '800', letterSpacing: 0.8 },
  memText: { color: L.dark, fontSize: 14, lineHeight: 20 },
  empty: { alignItems: 'center', marginTop: 60, gap: 12 },
  emptyText: { color: L.textLight, fontSize: 14 },
});
