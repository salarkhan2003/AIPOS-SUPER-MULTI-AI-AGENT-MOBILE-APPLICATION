import { useEffect, useState } from 'react';
import { View, Text, Pressable, StyleSheet, ScrollView, ActivityIndicator } from 'react-native';
import { router } from 'expo-router';
import { B } from '@/constants/basic';
import { fetchPredictions, runGhost } from '@/lib/orchestrator';
import { useGhostStore } from '@/store/ghostStore';
import { speak } from '@/lib/voice';

export default function HomeScreen() {
  const predictions = useGhostStore((s) => s.predictions);
  const setPredictions = useGhostStore((s) => s.setPredictions);
  const [loading, setLoading] = useState(false);
  const [cmd, setCmd] = useState('');

  useEffect(() => {
    fetchPredictions().then(setPredictions);
  }, [setPredictions]);

  const run = async (text: string) => {
    setLoading(true);
    setCmd(text);
    try {
      const { finalMessage, thoughts } = await runGhost(text);
      thoughts.forEach((t) => useGhostStore.getState().addThought(t));
      speak(finalMessage);
    } catch (e) {
      speak(`Error: ${String(e)}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScrollView style={s.root} contentContainerStyle={s.pad}>
      <Text style={s.h1}>Ghost OS</Text>
      <Text style={s.sub}>Command center · real agents</Text>

      {loading && <ActivityIndicator color={B.accent} style={{ marginVertical: 12 }} />}

      <Text style={s.section}>Predictions (Planner)</Text>
      {predictions.map((p) => (
        <Pressable key={p.id} style={s.card} onPress={() => run(p.action ?? p.title)}>
          <Text style={s.cardTitle}>{p.title}</Text>
          <Text style={s.cardSub}>{p.subtitle}</Text>
        </Pressable>
      ))}

      <Text style={s.section}>Quick run</Text>
      <Pressable style={s.btn} onPress={() => run("text Mom I'm reaching in 10min")}>
        <Text style={s.btnTxt}>Text Mom (WhatsApp)</Text>
      </Pressable>
      <Pressable style={s.btn} onPress={() => run('book cab to station')}>
        <Text style={s.btnTxt}>Book cab (Uber)</Text>
      </Pressable>
      <Pressable style={s.btn} onPress={() => router.push('/command-center')}>
        <Text style={s.btnTxt}>Neural Log</Text>
      </Pressable>

      {cmd ? <Text style={s.last}>Last: {cmd}</Text> : null}
    </ScrollView>
  );
}

const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: B.bg },
  pad: { padding: B.pad, paddingTop: 56, paddingBottom: 100 },
  h1: { color: B.text, fontSize: 28, fontWeight: '800' },
  sub: { color: B.dim, marginBottom: 16 },
  section: { color: B.accent, fontWeight: '700', marginTop: 16, marginBottom: 8 },
  card: { backgroundColor: B.card, padding: B.pad, borderRadius: B.radius, marginBottom: 8 },
  cardTitle: { color: B.text, fontWeight: '600' },
  cardSub: { color: B.dim, fontSize: 13, marginTop: 4 },
  btn: { backgroundColor: B.accent, padding: 14, borderRadius: B.radius, marginBottom: 8 },
  btnTxt: { color: B.bg, fontWeight: '700', textAlign: 'center' },
  last: { color: B.dim, marginTop: 12, fontSize: 12 },
});
