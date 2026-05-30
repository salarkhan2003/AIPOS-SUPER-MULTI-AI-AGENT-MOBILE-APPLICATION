import { useEffect, useRef, useState } from 'react';
import { View, Text, Pressable, StyleSheet, ScrollView } from 'react-native';
import { B } from '@/constants/basic';
import { runGhost } from '@/lib/orchestrator';
import { containsWakeWord, recordChunk, speak, stripWakeWord, stopSpeaking } from '@/lib/voice';
import { useGhostStore } from '@/store/ghostStore';

export default function VoiceScreen() {
  const [status, setStatus] = useState('Tap to speak · say "Hey Ghost"');
  const [lines, setLines] = useState<string[]>([]);
  const followUpRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const addThought = useGhostStore((s) => s.addThought);

  const processUtterance = async (raw: string) => {
    let text = raw;
    if (containsWakeWord(text)) text = stripWakeWord(text);
    if (!text.trim()) return;

    setLines((l) => [`You: ${text}`, ...l]);
    setStatus('Ghost thinking…');
    try {
      const { finalMessage, thoughts } = await runGhost(text);
      thoughts.forEach((t) => addThought(t));
      setLines((l) => [`Ghost: ${finalMessage}`, ...l]);
      setStatus('Speaking…');
      speak(finalMessage, () => {
        setStatus('Listening 5s for follow-up…');
        followUpRef.current = setTimeout(async () => {
          try {
            setStatus('Recording…');
            const more = await recordChunk(5000);
            if (more.trim()) await processUtterance(more);
            else setStatus('Tap to speak');
          } catch {
            setStatus('Tap to speak');
          }
        }, 500);
      });
    } catch (e) {
      setStatus(`Error: ${String(e)}`);
      speak('Something went wrong.');
    }
  };

  const onRecord = async () => {
    stopSpeaking();
    if (followUpRef.current) clearTimeout(followUpRef.current);
    setStatus('Recording… say Hey Ghost…');
    try {
      const text = await recordChunk(6000);
      await processUtterance(text || 'hey ghost help');
    } catch (e) {
      setStatus(String(e));
    }
  };

  useEffect(() => () => { if (followUpRef.current) clearTimeout(followUpRef.current); }, []);

  return (
    <View style={s.root}>
      <Text style={s.h1}>Voice</Text>
      <Text style={s.status}>{status}</Text>
      <Pressable style={s.orb} onPress={onRecord}>
        <Text style={s.orbTxt}>MIC</Text>
      </Pressable>
      <ScrollView style={s.log}>
        {lines.map((l, i) => (
          <Text key={i} style={s.line}>{l}</Text>
        ))}
      </ScrollView>
    </View>
  );
}

const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: B.bg, padding: B.pad, paddingTop: 56 },
  h1: { color: B.text, fontSize: 24, fontWeight: '700' },
  status: { color: B.dim, marginVertical: 12 },
  orb: { width: 120, height: 120, borderRadius: 60, backgroundColor: B.accent, alignSelf: 'center', alignItems: 'center', justifyContent: 'center' },
  orbTxt: { color: B.bg, fontWeight: '800', fontSize: 18 },
  log: { marginTop: 24, flex: 1 },
  line: { color: B.text, marginBottom: 10, fontSize: 14 },
});
