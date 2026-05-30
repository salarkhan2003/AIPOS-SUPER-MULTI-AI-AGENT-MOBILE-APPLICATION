import { useState } from 'react';
import { TextInput, Text } from 'react-native';
import { BasicScreen, Card } from '@/components/Screen';
import { B } from '@/constants/basic';
import { memory } from '@/lib/memory';

export default function SearchScreen() {
  const [q, setQ] = useState('');
  const [hits, setHits] = useState<Awaited<ReturnType<typeof memory.search>>>([]);
  return (
    <BasicScreen title="Smart Search">
      <TextInput style={{ backgroundColor: B.card, color: B.text, padding: 12, borderRadius: 12, marginBottom: 12 }} value={q} onChangeText={setQ} placeholder="Aadhar…" placeholderTextColor={B.dim} onSubmitEditing={() => memory.search(q).then(setHits)} />
      {hits.map((h) => (
        <Card key={h.id}><Text style={{ color: B.text }}>{h.text}</Text></Card>
      ))}
    </BasicScreen>
  );
}
