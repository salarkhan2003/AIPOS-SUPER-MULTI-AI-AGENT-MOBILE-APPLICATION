import { Icon } from '@/components/Icon';
import { formatDisplayText } from '@/lib/displayText';
import { isGroqConfigured } from '@/lib/groq';
import { useTheme } from '@/lib/themeContext';
import { notifyTaskDone } from '@/lib/notifications-local';
import { runGhost } from '@/lib/orchestrator';
import { voiceStorage, type VoiceEntry } from '@/lib/storage';
import { containsWakeWord, recordChunk, speak, stopSpeaking, stripWakeWord } from '@/lib/voice';
import { useGhostStore } from '@/store/ghostStore';
import * as Haptics from 'expo-haptics';
import { useEffect, useMemo, useRef, useState } from 'react';
import {
    Pressable,
    ScrollView,
    StatusBar,
    StyleSheet,
    Text,
    TextInput,
    View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

function timeLabel(ts: number): string {
  return new Date(ts).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' });
}

export default function VoiceScreen() {
  const insets = useSafeAreaInsets();
  const { colors: C, isDark } = useTheme();
  const styles = useMemo(() => makeStyles(C), [C]);
  const quickCommands = useMemo(
    () => [
      { label: 'Book cab', cmd: 'book cab to station', color: C.coral },
      { label: 'Text Mom', cmd: "text Mom I'm on my way", color: C.violet },
      { label: 'Check train', cmd: 'check train 12712 status', color: C.mint },
      { label: 'Weather', cmd: 'what is the weather in Nellore today', color: C.orange },
      { label: 'Remind me', cmd: 'remind me to drink water every hour', color: C.blue },
      { label: 'Summarise', cmd: 'summarise my recent activity', color: C.yellow },
    ],
    [C],
  );
  const [status, setStatus] = useState<'idle' | 'recording' | 'thinking'>('idle');
  const [manualText, setManualText] = useState('');
  const [slowHint, setSlowHint] = useState(false);
  const [apiReady] = useState(() => isGroqConfigured());
  const [history, setHistory] = useState<VoiceEntry[]>([]);
  const followUpRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const addThought = useGhostStore((s) => s.addThought);
  const scrollRef = useRef<ScrollView>(null);
  // Force-stop flag — when true, all async loops abort immediately
  const stoppedRef = useRef(false);

  useEffect(() => {
    voiceStorage.list().then(setHistory);
    return () => {
      stoppedRef.current = true;
      if (followUpRef.current) clearTimeout(followUpRef.current);
      stopSpeaking();
    };
  }, []);

  const appendLine = async (speaker: VoiceEntry['speaker'], text: string) => {
    const entry = await voiceStorage.append({ speaker, text });
    setHistory((h) => [entry, ...h]);
  };

  const processUtterance = async (raw: string) => {
    if (stoppedRef.current) return;
    let text = raw;
    if (containsWakeWord(text)) text = stripWakeWord(text);
    if (!text.trim()) return;
    await appendLine('you', text);
    if (stoppedRef.current) return;
    setStatus('thinking');
    try {
      const { finalMessage, thoughts } = await runGhost(text);
      if (stoppedRef.current) return;
      thoughts.forEach((t) => addThought(t));
      const clean = formatDisplayText(finalMessage);
      await appendLine('ghost', clean);
      await notifyTaskDone('Voice command', clean);
      speak(clean, () => {
        if (stoppedRef.current) return;
        setStatus('idle');
        followUpRef.current = setTimeout(async () => {
          if (stoppedRef.current) return;
          const more = await recordChunk(5000);
          if (!stoppedRef.current && more.trim()) await processUtterance(more);
        }, 500);
      });
    } catch (err) {
      if (!stoppedRef.current) {
        const msg =
          err instanceof Error ? err.message : 'Sorry, something went wrong. Please try again.';
        await appendLine('ghost', msg);
        speak(msg, () => setStatus('idle'));
      }
    }
  };

  const onRecord = async () => {
    stoppedRef.current = false;
    stopSpeaking();
    if (followUpRef.current) clearTimeout(followUpRef.current);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setStatus('recording');
    setSlowHint(false);
    const slowTimer = setTimeout(() => setSlowHint(true), 5000);
    try {
      const text = await recordChunk(8000);
      clearTimeout(slowTimer);
      setSlowHint(false);
      if (!stoppedRef.current) {
        const trimmed = text?.trim() ?? '';
        if (trimmed) await processUtterance(trimmed);
        else setStatus('idle');
      }
    } catch {
      clearTimeout(slowTimer);
      setSlowHint(false);
      if (!stoppedRef.current) setStatus('idle');
    }
  };

  const sendManual = async () => {
    const text = manualText.trim();
    if (!text) return;
    if (status !== 'idle') forceStop();
    stoppedRef.current = false;
    setManualText('');
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    await processUtterance(text);
  };

  /** Force stop — kills recording, speech, follow-up timers, resets state */
  const forceStop = () => {
    stoppedRef.current = true;
    stopSpeaking();
    if (followUpRef.current) clearTimeout(followUpRef.current);
    followUpRef.current = null;
    setStatus('idle');
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
  };

  const runQuick = async (cmd: string) => {
    if (status !== 'idle') return;
    stoppedRef.current = false;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    await processUtterance(cmd);
  };

  const clearHistory = async () => {
    await voiceStorage.clear();
    setHistory([]);
  };

  const orbColor = status === 'recording' ? C.coral : status === 'thinking' ? C.violet : C.ink;
  const statusLabel =
    status === 'recording' ? 'Listening…' :
    status === 'thinking'  ? 'Ghost is thinking…' :
    'Tap mic to speak';

  const isActive = status !== 'idle';

  return (
    <View style={[styles.root, { paddingTop: insets.top }]}>
      <StatusBar barStyle={isDark ? 'light-content' : 'dark-content'} />

      {/* Header */}
      <View style={styles.header}>
        <View>
          <Text style={styles.title}>Voice</Text>
          <Text style={styles.subtitle}>Say "Hey Ghost" anytime</Text>
        </View>
        <View style={styles.headerRight}>
          {history.length > 0 && (
            <Pressable style={styles.clearBtn} onPress={clearHistory}>
              <Icon name="close" size={13} color={C.textMid} />
              <Text style={styles.clearText}>Clear</Text>
            </Pressable>
          )}
        </View>
      </View>

      {!apiReady ? (
        <View style={[styles.apiBanner, { backgroundColor: C.orange + '22', borderColor: C.orange }]}>
          <Text style={[styles.apiBannerText, { color: C.text }]}>
            AI key not set. Add EXPO_PUBLIC_GROQ_API_KEY in aipos/.env and restart Expo (npx expo start -c).
          </Text>
        </View>
      ) : null}

      {/* Orb + stop */}
      <View style={styles.orbSection}>
        <Pressable
          onPress={isActive ? undefined : onRecord}
          disabled={isActive}
          style={({ pressed }) => [
            styles.orbOuter,
            { transform: [{ scale: pressed ? 0.93 : 1 }] },
          ]}>
          <View style={[styles.orb, { backgroundColor: orbColor }]}>
            {status === 'thinking' ? (
              <View style={styles.thinkingDots}>
                {[0, 1, 2].map((i) => (
                  <View key={i} style={[styles.dot, { opacity: 0.4 + i * 0.3 }]} />
                ))}
              </View>
            ) : (
              <Icon name="mic" size={44} color="#fff" />
            )}
          </View>
        </Pressable>

        {/* Status pill */}
        <View style={[styles.statusPill, { backgroundColor: isActive ? orbColor : C.surface }]}>
          <View style={[styles.statusDot, { backgroundColor: isActive ? '#fff' : C.textLight }]} />
          <Text style={[styles.statusText, { color: isActive ? '#fff' : C.textMid }]}>
            {statusLabel}
          </Text>
        </View>

        {/* Force stop button — only visible when active */}
        {slowHint && status === 'recording' ? (
          <Text style={[styles.slowHint, { color: C.orange }]}>Still listening… or type below and tap Send</Text>
        ) : null}

        {isActive && (
          <Pressable style={styles.stopBtn} onPress={forceStop}>
            <View style={styles.stopIcon}>
              <View style={styles.stopSquare} />
            </View>
            <Text style={styles.stopText}>Stop</Text>
          </Pressable>
        )}
      </View>

      {/* Backup text + Send — always visible */}
      <View style={styles.manualBox}>
        <Text style={styles.manualLabel}>BACKUP — TYPE & SEND</Text>
        <TextInput
          style={[styles.manualInput, { color: C.text, borderColor: C.border, backgroundColor: C.surface }]}
          placeholder='Type if mic is slow… e.g. text Mom I will reach in 10 minutes'
          placeholderTextColor={C.textLight}
          value={manualText}
          onChangeText={setManualText}
          multiline
          editable={status !== 'thinking'}
        />
        <Pressable
          style={[
            styles.manualSend,
            {
              backgroundColor: manualText.trim() ? C.violet : C.border,
              opacity: manualText.trim() ? 1 : 0.65,
            },
          ]}
          onPress={sendManual}
          disabled={!manualText.trim()}>
          <Icon name="forward" size={18} color="#fff" />
          <Text style={styles.manualSendText}>
            {status === 'recording' ? 'Send (stop mic & send)' : 'Send to Ghost'}
          </Text>
        </Pressable>
      </View>

      {/* Quick commands */}
      <View style={styles.quickSection}>
        <Text style={styles.quickLabel}>QUICK COMMANDS</Text>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.quickScroll}>
          {quickCommands.map((q) => (
            <Pressable
              key={q.cmd}
              style={[styles.quickChip, { backgroundColor: q.color, opacity: isActive ? 0.4 : 1 }]}
              onPress={() => runQuick(q.cmd)}
              disabled={isActive}>
              <Text style={[styles.quickChipText, { color: q.color === C.yellow ? C.dark : '#fff' }]}>
                {q.label}
              </Text>
            </Pressable>
          ))}
        </ScrollView>
      </View>

      {/* Conversation history */}
      <ScrollView
        ref={scrollRef}
        style={styles.log}
        contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 120 }}
        showsVerticalScrollIndicator={false}>
        {history.length === 0 ? (
          <View style={styles.emptyWrap}>
            <View style={styles.emptyOrb}>
              <Icon name="mic" size={32} color={C.textLight} />
            </View>
            <Text style={styles.emptyTitle}>No conversations yet</Text>
            <Text style={styles.emptyBody}>Tap the mic or use a quick command above</Text>
          </View>
        ) : (
          history.map((entry) => (
            <View
              key={entry.id}
              style={[styles.bubble, entry.speaker === 'you' ? styles.bubbleYou : styles.bubbleGhost]}>
              <View style={styles.bubbleHeader}>
                <Text style={[
                  styles.bubbleSpeaker,
                  { color: entry.speaker === 'you' ? 'rgba(255,255,255,0.55)' : C.textLight },
                ]}>
                  {entry.speaker === 'you' ? 'You' : 'Ghost AI'}
                </Text>
                <Text style={[
                  styles.bubbleTime,
                  { color: entry.speaker === 'you' ? 'rgba(255,255,255,0.35)' : C.textLight },
                ]}>
                  {timeLabel(entry.timestamp)}
                </Text>
              </View>
              <Text style={[styles.bubbleText, entry.speaker === 'ghost' && styles.bubbleTextGhost]}>
                {entry.text}
              </Text>
            </View>
          ))
        )}
      </ScrollView>
    </View>
  );
}

function makeStyles(C: ReturnType<typeof useTheme>['colors']) {
  return StyleSheet.create({
  root: { flex: 1, backgroundColor: C.bg },

  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 8,
    paddingBottom: 4,
  },
  title: { fontSize: 28, fontWeight: '800', color: C.text, letterSpacing: -0.5 },
  subtitle: { color: C.textMid, fontSize: 13, marginTop: 2 },
  headerRight: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  clearBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    paddingHorizontal: 12, paddingVertical: 6,
    backgroundColor: C.surface, borderRadius: 20,
    borderWidth: 1, borderColor: C.border,
  },
  clearText: { color: C.textMid, fontSize: 12, fontWeight: '600' },

  orbSection: { alignItems: 'center', paddingTop: 24, paddingBottom: 16 },
  orbOuter: {
    shadowColor: '#000', shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.18, shadowRadius: 24, elevation: 14,
    marginBottom: 14,
  },
  orb: { width: 110, height: 110, borderRadius: 55, alignItems: 'center', justifyContent: 'center' },
  thinkingDots: { flexDirection: 'row', gap: 8 },
  dot: { width: 10, height: 10, borderRadius: 5, backgroundColor: '#fff' },

  statusPill: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    paddingHorizontal: 18, paddingVertical: 8,
    borderRadius: 20, borderWidth: 1, borderColor: C.border,
    marginBottom: 12,
  },
  statusDot: { width: 6, height: 6, borderRadius: 3 },
  statusText: { fontSize: 13, fontWeight: '600' },

  // Force stop button
  stopBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    backgroundColor: C.coral,
    paddingHorizontal: 20, paddingVertical: 10,
    borderRadius: 20,
    shadowColor: C.coral, shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.35, shadowRadius: 10, elevation: 6,
  },
  stopIcon: {
    width: 18, height: 18, borderRadius: 9,
    borderWidth: 2, borderColor: '#fff',
    alignItems: 'center', justifyContent: 'center',
  },
  stopSquare: { width: 7, height: 7, backgroundColor: '#fff', borderRadius: 1 },
  stopText: { color: '#fff', fontWeight: '800', fontSize: 14 },
  slowHint: { fontSize: 12, fontWeight: '600', textAlign: 'center', marginBottom: 8, paddingHorizontal: 24 },
  apiBanner: {
    marginHorizontal: 16,
    marginTop: 8,
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
  },
  apiBannerText: { fontSize: 12, fontWeight: '600', lineHeight: 18 },
  manualBox: { paddingHorizontal: 16, paddingBottom: 8, gap: 8 },
  manualLabel: {
    fontSize: 10,
    fontWeight: '800',
    color: C.textLight,
    letterSpacing: 1.2,
  },
  manualInput: {
    minHeight: 56,
    borderRadius: 14,
    borderWidth: 1.5,
    paddingHorizontal: 14,
    paddingVertical: 10,
    fontSize: 15,
  },
  manualSend: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    borderRadius: 14,
    paddingVertical: 14,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.12,
    shadowRadius: 8,
    elevation: 4,
  },
  manualSendText: { color: '#fff', fontWeight: '800', fontSize: 14 },

  quickSection: { paddingBottom: 10 },
  quickLabel: {
    fontSize: 10, fontWeight: '800', color: C.textLight,
    letterSpacing: 1.2, paddingHorizontal: 20, marginBottom: 8,
  },
  quickScroll: { paddingHorizontal: 16, gap: 8 },
  quickChip: {
    paddingHorizontal: 16, paddingVertical: 9, borderRadius: 20,
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.10, shadowRadius: 6, elevation: 3,
  },
  quickChipText: { fontSize: 13, fontWeight: '700' },

  log: { flex: 1 },
  emptyWrap: { alignItems: 'center', marginTop: 40, gap: 12 },
  emptyOrb: {
    width: 72, height: 72, borderRadius: 36,
    backgroundColor: C.surface, alignItems: 'center', justifyContent: 'center',
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06, shadowRadius: 8, elevation: 2,
  },
  emptyTitle: { fontSize: 17, fontWeight: '800', color: C.text },
  emptyBody: { color: C.textMid, fontSize: 14, textAlign: 'center' },

  bubble: {
    borderRadius: 20, padding: 14, marginBottom: 10,
    maxWidth: '82%',
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06, shadowRadius: 8, elevation: 2,
  },
  bubbleYou: { backgroundColor: C.ink, alignSelf: 'flex-end' as const },
  bubbleGhost: { backgroundColor: C.surface, alignSelf: 'flex-start' as const },
  bubbleHeader: {
    flexDirection: 'row' as const,
    justifyContent: 'space-between' as const,
    marginBottom: 5,
  },
  bubbleSpeaker: { fontSize: 10, fontWeight: '700' as const, letterSpacing: 0.5 },
  bubbleTime: { fontSize: 10 },
  bubbleText: { color: '#fff', fontSize: 15, lineHeight: 22 },
  bubbleTextGhost: { color: C.text },
  });
}
