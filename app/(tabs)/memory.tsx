import { useEffect, useState } from 'react';
import { View, Text, TextInput, Pressable, StyleSheet, FlatList } from 'react-native';
import { B } from '@/constants/basic';
import { memory } from '@/lib/memory';
import type { MemoryRecord } from '@/types';

export default function MemoryScreen() {
  const [items, setItems] = useState<MemoryRecord[]>([]);
  const [query, setQuery] = useState('');
  const [input, setInput] = useState('');

  const refresh = async () => {
    const list = query.trim() ? await memory.search(query, 20) : await memory.list(50);
    setItems(list);
  };

  useEffect(() => { refresh(); }, [query]);

  const add = async () => {
    if (!input.trim()) return;
    await memory.add(input.trim(), 'semantic');
    setInput('');
    refresh();
  };

  return (
    <View style={s.root}>
      <Text style={s.h1}>Memory</Text>
      <TextInput style={s.input} placeholder="Search…" placeholderTextColor={B.dim} value={query} onChangeText={setQuery} />
      <View style={s.row}>
        <TextInput style={[s.input, { flex: 1 }]} placeholder="Add memory…" placeholderTextColor={B.dim} value={input} onChangeText={setInput} />
        <Pressable style={s.btn} onPress={add}><Text style={s.btnTxt}>Add</Text></Pressable>
      </View>
      <FlatList
        data={items}
        keyExtractor={(i) => i.id}
        renderItem={({ item }) => (
          <View style={s.card}>
            <Text style={s.type}>{item.type}</Text>
            <Text style={s.text}>{item.text}</Text>
          </View>
        )}
      />
    </View>
  );
}

const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: B.bg, padding: B.pad, paddingTop: 56 },
  h1: { color: B.text, fontSize: 24, fontWeight: '700', marginBottom: 12 },
  input: { backgroundColor: B.card, color: B.text, padding: 12, borderRadius: B.radius, marginBottom: 8 },
  row: { flexDirection: 'row', gap: 8 },
  btn: { backgroundColor: B.accent, padding: 12, borderRadius: B.radius, justifyContent: 'center' },
  btnTxt: { color: B.bg, fontWeight: '700' },
  card: { backgroundColor: B.card, padding: 12, borderRadius: B.radius, marginBottom: 8 },
  type: { color: B.accent, fontSize: 10, fontWeight: '700' },
  text: { color: B.text, marginTop: 4 },
});
