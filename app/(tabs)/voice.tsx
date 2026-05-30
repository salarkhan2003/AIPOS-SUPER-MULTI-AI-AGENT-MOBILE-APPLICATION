import { Icon } from '@/components/Icon';
import { L } from '@/constants/light';
import { runGhost } from '@/lib/orchestrator';
import { containsWakeWord, recordChunk, speak, stopSpeaking, stripWakeWord } from '@/lib/voice';
import { useGhostStore } from '@/store/ghostStore';
import { useEffect, useRef, useState } from 'react';
import { Pressable, ScrollView, StatusBar, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

type Line = { id: number; speaker: 'you' | 'ghost'; text: string };

export default function VoiceScreen() {
  const insets = useSafeAreaInsets();
  const [status, setStatus] = useState<'idle' | 'recording' | 'thinking'>('idle');
  const [lines, setLines] = useState<Line[]>([]);
  const followUpRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const addThought = useGhostStore((s) => s.addThought);
  const idRef = useRef(0);

  const addLine = (speaker: Line['speaker'], text: string) =>
    setLines((l) => [{ id: idRef.current++, speaker, text }, ...l]);

  const processUtterance = async (raw: string) => {
    let text = raw;
    if (containsWakeWord(text)) text = stripWakeWord(text);
    if (!text.trim()) return;
    addLine('you', text);
    setStatus('thinking');
    try {
      const { finalMessage, thoughts } = await runGhost(text);
      thoughts.forEach((t) => addThought(t));
      addLine('ghost', finalMessage);
      speak(finalMessage, () => {
        setStatus('idle');
        followUpRef.current = setTimeout(async () => {
          const more = await recordChunk(5000);
          if (more.trim()) await processUtterance(more);
        }, 500);
      });
    } catch {
      setStatus('idle');
    }
  };

  const onRecord = async () => {
    stopSpeaking();
    if (followUpRef.current) clearTimeout(followUpRef.current);
    setStatus('recording');
    try {
      const text = await recordChunk(6000);
      await processUtterance(text || 'hey ghost help');
    } catch (e) {
      setStatus('idle');
    }
  };

  useEffect(() => () => { if (followUpRef.current) clearTimeout(followUpRef.current); }, []);

  const statusLabel = status === 'recording' ? 'Listening…' : status === 'thinking' ? 'Ghost thinking…' : 'Tap to speak';
  const orbColor = status === 'recording' ? L.coral : status === 'thinking' ? L.violet : L.dark;

  return (
    <View style={[styles.root, { paddingTop: insets.top }]}>
      <StatusBar barStyle="dark-content" />

      <View style={styles.header}>
        <Text style={styles.title}>Voice</Text>
        <Text style={styles.subtitle}>Say "Hey Ghost" to start</Text>
      </View>

      {/* Orb */}
      <View style={styles.orbSection}>
        <Pressable
          onPress={onRecord}
          style={({ pressed }) => [styles.orbOuter, { transform: [{ scale: pressed ? 0.94 : 1 }] }]}>
          <View style={[styles.orb, { backgroundColor: orbColor }]}>
            <Icon name="mic" size={40} color="#fff" />
          </View>
        </Pressable>
        <View style={[styles.statusPill, { backgroundColor: status === 'idle' ? L.bg : orbColor }]}>
          <Text style={[styles.statusText, { color: status === 'idle' ? L.textMid : '#fff' }]}>
            {statusLabel}
          </Text>
        </View>
      </View>

      {/* Conversation */}
      <ScrollView style={styles.log} contentContainerStyle={{ paddingBottom: 120, paddingHorizontal: 16 }}>
        {lines.length === 0 && (
          <View style={styles.emptyWrap}>
            <Text style={styles.emptyText}>Your conversation will appear here</Text>
          </View>
        )}
        {lines.map((line) => (
          <View key={line.id} style={[styles.bubble, line.speaker === 'you' ? styles.bubbleYou : styles.bubbleGhost]}>
            <Text style={styles.bubbleSpeaker}>{line.speaker === 'you' ? 'You' : 'Ghost'}</Text>
            <Text style={[styles.bubbleText, line.speaker === 'ghost' && styles.bubbleTextGhost]}>
              {line.text}
            </Text>
          </View>
        ))}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: L.bg },
  header: { paddingHorizontal: 20, paddingTop: 8, paddingBottom: 4 },
  title: { fontSize: 28, fontWeight: '800', color: L.dark, letterSpacing: -0.5 },
  subtitle: { color: L.textMid, fontSize: 14, marginTop: 2 },
  orbSection: { alignItems: 'center', paddingVertical: 36 },
  orbOuter: {
    shadowColor: '#000', shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.15, shadowRadius: 24, elevation: 12,
    marginBottom: 20,
  },
  orb: {
    width: 120, height: 120, borderRadius: 60,
    alignItems: 'center', justifyContent: 'center',
  },
  statusPill: {
    paddingHorizontal: 20, paddingVertical: 8,
    borderRadius: L.radius.pill,
    borderWidth: 1, borderColor: L.border,
  },
  statusText: { fontSize: 14, fontWeight: '600' },
  log: { flex: 1 },
  emptyWrap: { alignItems: 'center', marginTop: 40 },
  emptyText: { color: L.textLight, fontSize: 14 },
  bubble: {
    borderRadius: L.radius.md, padding: 14,
    marginBottom: 10,
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06, shadowRadius: 8, elevation: 2,
  },
  bubbleYou: { backgroundColor: L.dark, alignSelf: 'flex-end', maxWidth: '80%' },
  bubbleGhost: { backgroundColor: L.surface, alignSelf: 'flex-start', maxWidth: '80%' },
  bubbleSpeaker: { fontSize: 10, fontWeight: '700', color: L.textLight, marginBottom: 4, letterSpacing: 0.8 },
  bubbleText: { color: '#fff', fontSize: 15, lineHeight: 22 },
  bubbleTextGhost: { color: L.dark },
});
