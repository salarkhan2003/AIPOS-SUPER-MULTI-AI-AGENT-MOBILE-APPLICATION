/**
 * Ghost AGI Voice Screen — production ready
 * - Voice type picker shown ONCE (saved to AsyncStorage, never repeated)
 * - Male voice: pitch 0.7, rate 0.85 | Female voice: pitch 1.3, rate 0.95
 * - Force Stop button at top-right — fully kills agent until user restarts
 * - Session-based history: each open/close = one session
 * - Dark/light theme aware
 * - Animated 3D orb: breathe idle, pulse listening, wave speaking
 */
import { Icon } from '@/components/Icon';
import { isAiConfigured } from '@/lib/agents';
import { formatDisplayText } from '@/lib/displayText';
import { notifyTaskDone } from '@/lib/notifications-local';
import { runGhost } from '@/lib/orchestrator';
import {
  prefsStorage,
  voiceSessionStorage,
  voiceStorage,
  type VoiceEntry,
} from '@/lib/storage';
import { useTheme } from '@/lib/themeContext';
import {
  containsWakeWord,
  recordChunk,
  stopSpeaking,
  stripWakeWord
} from '@/lib/voice';
import { useGhostStore } from '@/store/ghostStore';
import * as Haptics from 'expo-haptics';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import * as Speech from 'expo-speech';
import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import {
  Animated,
  Pressable,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

type VoiceGender = 'male' | 'female';
type ConvStatus = 'idle' | 'recording' | 'thinking' | 'speaking' | 'stopped';

function timeLabel(ts: number) {
  return new Date(ts).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' });
}

// ── Voice config per gender ───────────────────────────────────────────────────
const VOICE_CONFIG: Record<VoiceGender, { pitch: number; rate: number; label: string; desc: string }> = {
  male:   { pitch: 0.7,  rate: 0.85, label: 'Male',   desc: 'Deep & authoritative' },
  female: { pitch: 1.3,  rate: 0.95, label: 'Female', desc: 'Warm & natural'       },
};

// ── 3D Mic icon built from View primitives ────────────────────────────────────
function MicIcon3D({ size = 36, color = '#fff' }: { size?: number; color?: string }) {
  const s = size / 36;
  return (
    <View style={{ width: size, height: size, alignItems: 'center', justifyContent: 'center' }}>
      <View style={{ width: 13 * s, height: 20 * s, borderRadius: 6.5 * s, backgroundColor: color, position: 'absolute', top: 0 }} />
      <View style={{ width: 20 * s, height: 10 * s, borderBottomLeftRadius: 10 * s, borderBottomRightRadius: 10 * s, borderWidth: 2.5 * s, borderColor: color, borderTopWidth: 0, position: 'absolute', top: 15 * s }} />
      <View style={{ width: 2.5 * s, height: 5 * s, backgroundColor: color, position: 'absolute', top: 25 * s }} />
      <View style={{ width: 13 * s, height: 2.5 * s, backgroundColor: color, borderRadius: 2 * s, position: 'absolute', top: 30 * s }} />
    </View>
  );
}

// ── Animated Orb — Simple animation when active, static when idle/stopped ──────────────
function ConvOrb({ status }: { status: ConvStatus }) {
  const breathe = useRef(new Animated.Value(0)).current;
  const pulse = useRef(new Animated.Value(0)).current;
  const isAnimating = status === 'recording' || status === 'speaking';

  useEffect(() => {
    const b = Animated.loop(Animated.sequence([
      Animated.timing(breathe, { toValue: 1, duration: 2400, useNativeDriver: true }),
      Animated.timing(breathe, { toValue: 0, duration: 2400, useNativeDriver: true }),
    ]));
    b.start();
    return () => b.stop();
  }, [breathe]);

  useEffect(() => {
    if (isAnimating) {
      const p = Animated.loop(Animated.sequence([
        Animated.timing(pulse, { toValue: 1, duration: 600, useNativeDriver: true }),
        Animated.timing(pulse, { toValue: 0, duration: 600, useNativeDriver: true }),
      ]));
      p.start();
      return () => p.stop();
    } else {
      pulse.setValue(0);
    }
  }, [isAnimating, pulse]);

  const orbScale = breathe.interpolate({ inputRange: [0, 1], outputRange: [1, status === 'stopped' ? 1 : 1.06] });
  const pulseScale = pulse.interpolate({ inputRange: [0, 1], outputRange: [1, 1.2] });
  const pulseOpacity = pulse.interpolate({ inputRange: [0, 1], outputRange: [0.3, 0] });

  const orbColor =
    status === 'recording' ? '#FF8A7A' :
    status === 'thinking'  ? '#FFC857' :
    status === 'speaking'  ? '#6EE7A0' :
    status === 'stopped'   ? '#444'    : '#6B4EFF';

  return (
    <View style={orbS.container}>
      {isAnimating && (
        <Animated.View style={[
          orbS.pulseRing,
          {
            transform: [{ scale: pulseScale }],
            opacity: pulseOpacity,
            borderColor: orbColor,
          }
        ]} />
      )}
      <Animated.View style={[orbS.orb, { transform: [{ scale: orbScale }] }]}>
        <LinearGradient
          colors={status === 'stopped' ? ['#333', '#222'] : [orbColor + 'BB', orbColor]}
          style={orbS.grad}>
          {isAnimating ? (
            <View style={orbS.waveContainer}>
              {[0, 1, 2].map((i) => (
                <View key={i} style={[orbS.wave, {
                  height: 20 + i * 10,
                  backgroundColor: orbColor,
                  opacity: 0.5 + i * 0.2
                }]} />
              ))}
            </View>
          ) : status === 'thinking' ? (
            <View style={orbS.dots}>
              {[0, 1, 2].map((i) => (
                <View key={i} style={[orbS.dot, { opacity: 0.4 + i * 0.3 }]} />
              ))}
            </View>
          ) : (
            <MicIcon3D size={28} color={status === 'stopped' ? '#888' : '#fff'} />
          )}
        </LinearGradient>
      </Animated.View>
    </View>
  );
}

const orbS = StyleSheet.create({
  container: { alignItems: 'center', justifyContent: 'center', height: 120, marginVertical: 0 },
  pulseRing: {
    position: 'absolute',
    width: 80, height: 80,
    borderRadius: 40,
    borderWidth: 3,
  },
  orb: {
    width: 80, height: 80, borderRadius: 40,
    elevation: 16, shadowColor: '#6B4EFF',
    shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.6, shadowRadius: 20,
  },
  grad: { flex: 1, borderRadius: 40, alignItems: 'center', justifyContent: 'center', overflow: 'hidden' },
  waveContainer: {
    flexDirection: 'row',
    gap: 4,
    alignItems: 'center',
  },
  wave: {
    width: 6,
    borderRadius: 3,
  },
  dots: { flexDirection: 'row', gap: 6 },
  dot: { width: 8, height: 8, borderRadius: 4, backgroundColor: '#fff' },
});

// ── Voice Type Picker — shown only once ───────────────────────────────────────
function VoiceTypePicker({ onSelect }: { onSelect: (g: VoiceGender) => void }) {
  const insets = useSafeAreaInsets();
  const { isDark } = useTheme();
  const [playing, setPlaying] = useState<VoiceGender | null>(null);

  const preview = (g: VoiceGender) => {
    Speech.stop();
    setPlaying(g);
    const cfg = VOICE_CONFIG[g];
    Speech.speak(
      g === 'male'
        ? "Hello, I'm Ghost. Your personal AGI assistant."
        : "Hi there! I'm Ghost, ready to help you with anything.",
      {
        language: 'en-IN',
        pitch: cfg.pitch,
        rate: cfg.rate,
        onDone: () => setPlaying(null),
        onStopped: () => setPlaying(null),
      },
    );
  };

  const bgColors: [string, string, string] = ['#1A0F2E', '#12081F', '#0D0616'];

  return (
    <View style={[pS.root, { paddingTop: insets.top + 40, paddingBottom: insets.bottom + 40 }]}>
      <LinearGradient colors={bgColors} style={StyleSheet.absoluteFill} />
      <Text style={pS.title}>Choose Ghost's Voice</Text>
      <Text style={pS.sub}>Tap Preview to hear each voice, then Select</Text>
      <Text style={pS.sub2}>This is asked only once — change anytime in More → AGI Agents</Text>

      <View style={pS.row}>
        {(['male', 'female'] as VoiceGender[]).map((g) => {
          const cfg = VOICE_CONFIG[g];
          const isMale = g === 'male';
          const gradColors: [string, string] = isMale ? ['#3D2B8E', '#6B4EFF'] : ['#8E2B6B', '#FF7EB6'];
          return (
            <View key={g} style={pS.cardWrap}>
              <LinearGradient colors={gradColors} style={pS.card}>
                {/* Icon */}
                <View style={[pS.iconRing, { borderColor: isMale ? '#9D8AFF' : '#FFB6D9' }]}>
                  <MicIcon3D size={30} color="#fff" />
                </View>
                <Text style={pS.cardLabel}>{cfg.label}</Text>
                <Text style={pS.cardDesc}>{cfg.desc}</Text>
                <Text style={pS.cardPitch}>Pitch {cfg.pitch} · Rate {cfg.rate}</Text>

                <Pressable
                  style={[pS.previewBtn, playing === g && { backgroundColor: 'rgba(255,255,255,0.3)' }]}
                  onPress={() => preview(g)}>
                  <Icon name={playing === g ? 'activity' : 'forward'} size={13} color="#fff" />
                  <Text style={pS.previewText}>{playing === g ? 'Playing…' : 'Preview'}</Text>
                </Pressable>

                <Pressable style={pS.selectBtn} onPress={() => {
                  Speech.stop();
                  Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
                  onSelect(g);
                }}>
                  <Text style={pS.selectText}>Select</Text>
                </Pressable>
              </LinearGradient>
            </View>
          );
        })}
      </View>
    </View>
  );
}

const pS = StyleSheet.create({
  root: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 20 },
  title: { color: '#fff', fontSize: 26, fontWeight: '900', textAlign: 'center', marginBottom: 8 },
  sub: { color: 'rgba(255,255,255,0.55)', fontSize: 13, textAlign: 'center', marginBottom: 4 },
  sub2: { color: 'rgba(255,255,255,0.3)', fontSize: 11, textAlign: 'center', marginBottom: 32 },
  row: { flexDirection: 'row', gap: 14, width: '100%' },
  cardWrap: { flex: 1, borderRadius: 22, overflow: 'hidden', elevation: 10, shadowColor: '#000', shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.35, shadowRadius: 18 },
  card: { padding: 20, alignItems: 'center', gap: 7 },
  iconRing: { width: 60, height: 60, borderRadius: 30, borderWidth: 2, backgroundColor: 'rgba(255,255,255,0.15)', alignItems: 'center', justifyContent: 'center', marginBottom: 2 },
  cardLabel: { color: '#fff', fontSize: 19, fontWeight: '900' },
  cardDesc: { color: 'rgba(255,255,255,0.65)', fontSize: 12, textAlign: 'center' },
  cardPitch: { color: 'rgba(255,255,255,0.4)', fontSize: 10 },
  previewBtn: { flexDirection: 'row', alignItems: 'center', gap: 5, backgroundColor: 'rgba(255,255,255,0.18)', paddingHorizontal: 14, paddingVertical: 7, borderRadius: 14, marginTop: 4 },
  previewText: { color: '#fff', fontSize: 12, fontWeight: '700' },
  selectBtn: { backgroundColor: '#fff', paddingHorizontal: 24, paddingVertical: 9, borderRadius: 18, marginTop: 4 },
  selectText: { color: '#1A0F2E', fontSize: 14, fontWeight: '900' },
});

// ── Main Voice Screen ─────────────────────────────────────────────────────────
export default function VoiceScreen() {
  const insets     = useSafeAreaInsets();
  const { isDark, colors: C } = useTheme();
  const addThought = useGhostStore((s) => s.addThought);
  const scrollRef  = useRef<ScrollView>(null);
  const stoppedRef = useRef(true);   // starts stopped — user must tap to begin
  const followRef  = useRef<ReturnType<typeof setTimeout> | null>(null);
  const sessionRef = useRef<string | null>(null);
  const msgCountRef = useRef(0);
  const firstMsgRef = useRef('');

  const [voiceGender, setVoiceGender] = useState<VoiceGender>('male');
  const [showPicker, setShowPicker]   = useState(false);
  const [status, setStatus]           = useState<ConvStatus>('stopped');
  const [history, setHistory]         = useState<VoiceEntry[]>([]);
  const [apiReady]                    = useState(() => isAiConfigured());

  // Load prefs — show picker only if never set
  useEffect(() => {
    (async () => {
      const prefs = await prefsStorage.get();
      const saved = (prefs as any).voiceGender as VoiceGender | undefined;
      if (!saved) {
        setShowPicker(true);
      } else {
        setVoiceGender(saved);
        setStatus('idle');
      }
      // Start a new session
      const sid = await voiceSessionStorage.start();
      sessionRef.current = sid;
      // Load this session's entries
      const entries = await voiceSessionStorage.getEntries(sid);
      setHistory(entries);
    })();

    return () => {
      stoppedRef.current = true;
      if (followRef.current) clearTimeout(followRef.current);
      stopSpeaking();
      // End session on unmount
      if (sessionRef.current) {
        voiceSessionStorage.end(sessionRef.current, msgCountRef.current, firstMsgRef.current);
      }
    };
  }, []);

  const handleSelectGender = async (g: VoiceGender) => {
    setVoiceGender(g);
    setShowPicker(false);
    setStatus('idle');
    const prefs = await prefsStorage.get();
    await prefsStorage.set({ ...prefs, voiceGender: g } as any);
  };

  const appendLine = useCallback(async (speaker: VoiceEntry['speaker'], text: string) => {
    const sid = sessionRef.current;
    let entry: VoiceEntry;
    if (sid) {
      entry = await voiceSessionStorage.appendEntry(sid, { speaker, text });
    } else {
      entry = await voiceStorage.append({ speaker, text });
    }
    // Also append to global voice history
    await voiceStorage.append({ speaker, text });
    if (speaker === 'you') {
      msgCountRef.current += 1;
      if (!firstMsgRef.current) firstMsgRef.current = text.slice(0, 60);
    }
    setHistory((h) => [...h, entry]);
    setTimeout(() => scrollRef.current?.scrollToEnd?.({ animated: true }), 120);
    return entry;
  }, []);

  const processUtterance = useCallback(async (raw: string) => {
    if (stoppedRef.current) return;
    let text = raw.trim();
    if (containsWakeWord(text)) text = stripWakeWord(text);
    if (!text) return;

    try {
      await appendLine('you', text);
      if (stoppedRef.current) return;
      setStatus('thinking');

      const { finalMessage, thoughts } = await runGhost(text);
      if (stoppedRef.current) return;
      thoughts.forEach((t) => addThought(t));
      const clean = formatDisplayText(finalMessage);
      await appendLine('ghost', clean);
      await notifyTaskDone('Ghost', clean);

      setStatus('speaking');
      const cfg = VOICE_CONFIG[voiceGender];
      Speech.speak(clean, {
        language: 'en-IN',
        pitch: cfg.pitch,
        rate: cfg.rate,
        onDone: () => {
          if (stoppedRef.current) return;
          setStatus('idle');
          // Auto-listen after response
          followRef.current = setTimeout(async () => {
            if (stoppedRef.current) return;
            setStatus('recording');
            const more = await recordChunk(6000);
            if (!stoppedRef.current && more.trim()) {
              await processUtterance(more);
            } else if (!stoppedRef.current) {
              setStatus('idle');
            }
          }, 900);
        },
        onStopped: () => { if (!stoppedRef.current) setStatus('idle'); },
      });
    } catch (err) {
      console.error('Error in processUtterance:', err);
      if (!stoppedRef.current) {
        const msg = err instanceof Error ? err.message : 'Something went wrong. Please try again.';
        try {
          await appendLine('ghost', msg);
        } catch {}
        setStatus('speaking');
        Speech.speak(msg, {
          language: 'en-IN',
          pitch: VOICE_CONFIG[voiceGender].pitch,
          rate: VOICE_CONFIG[voiceGender].rate,
          onDone: () => { if (!stoppedRef.current) setStatus('idle'); },
        });
      }
    }
  }, [addThought, appendLine, voiceGender]);

  const startListening = useCallback(async () => {
    if (status !== 'idle') return;
    stoppedRef.current = false;
    stopSpeaking();
    if (followRef.current) clearTimeout(followRef.current);
    
    try {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    } catch {}
    
    setStatus('recording');
    try {
      const text = await recordChunk(8000);
      if (!stoppedRef.current) {
        if (text.trim()) {
          await processUtterance(text);
        } else {
          setStatus('idle');
        }
      }
    } catch (error) {
      console.error('Error in startListening:', error);
      if (!stoppedRef.current) setStatus('idle');
    }
  }, [status, processUtterance]);

  /** Force stop — kills everything until user taps restart */
  const forceStop = useCallback(() => {
    stoppedRef.current = true;
    try { stopSpeaking(); } catch {}
    try { Speech.stop(); } catch {}
    if (followRef.current) {
      clearTimeout(followRef.current);
      followRef.current = null;
    }
    setStatus('stopped');
    try {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
    } catch {}
  }, []);

  const restartSession = useCallback(async () => {
    // End old session, start new one
    try {
      if (sessionRef.current) {
        await voiceSessionStorage.end(sessionRef.current, msgCountRef.current, firstMsgRef.current);
      }
    } catch (error) {
      console.error('Error ending session:', error);
    }

    try {
      const sid = await voiceSessionStorage.start();
      sessionRef.current = sid;
    } catch (error) {
      console.error('Error starting session:', error);
    }

    msgCountRef.current = 0;
    firstMsgRef.current = '';
    setHistory([]);
    stoppedRef.current = false;
    setStatus('idle');
    
    try {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    } catch {}
  }, []);

  const statusLabel = useMemo(() => {
    if (status === 'recording') return 'Listening…';
    if (status === 'thinking')  return 'Ghost is thinking…';
    if (status === 'speaking')  return 'Ghost is speaking…';
    if (status === 'stopped')   return 'Stopped — tap restart';
    return 'Tap orb to speak';
  }, [status]);

  const isActive = status === 'recording' || status === 'thinking' || status === 'speaking';
  const isStopped = status === 'stopped';

  if (showPicker) return <VoiceTypePicker onSelect={handleSelectGender} />;

  const gradColors: [string, string, string] = isDark
    ? ['#1A0F2E', '#12081F', '#0D0616']
    : ['#F5F2FF', '#EDE8FF', '#E8E0FF'];

  return (
    <View style={S.root}>
      <StatusBar barStyle="light-content" />
      <LinearGradient colors={gradColors} style={StyleSheet.absoluteFill} />

      {/* Header */}
      <View style={[S.header, { paddingTop: insets.top + 8 }]}>
        <Pressable style={S.hBtn} onPress={() => router.back()}>
          <Icon name="close" size={18} color={isDark ? 'rgba(255,255,255,0.7)' : 'rgba(0,0,0,0.6)'} />
        </Pressable>

        <View style={S.hCenter}>
          <Text style={[S.hTitle, { color: isDark ? '#fff' : '#1A0F2E' }]}>Ghost AGI</Text>
          <View style={S.statusRow}>
            <View style={[S.statusDot, {
              backgroundColor:
                status === 'recording' ? '#FF8A7A' :
                status === 'thinking'  ? '#FFC857' :
                status === 'speaking'  ? '#6EE7A0' :
                status === 'stopped'   ? '#555'    : '#9D8AFF',
            }]} />
            <Text style={[S.statusText, { color: isDark ? 'rgba(255,255,255,0.6)' : 'rgba(0,0,0,0.5)' }]}>{statusLabel}</Text>
          </View>
        </View>

        {/* Force Stop — always visible at top right */}
        <Pressable
          style={[S.forceStopBtn, isStopped && { backgroundColor: '#6B4EFF' }]}
          onPress={isStopped ? restartSession : forceStop}>
          <Icon name={isStopped ? 'activity' : 'close'} size={14} color="#fff" />
          <Text style={S.forceStopText}>{isStopped ? 'Restart' : 'Stop'}</Text>
        </Pressable>
      </View>

      {!apiReady && (
        <View style={S.apiBanner}>
          <Text style={S.apiBannerText}>AI not configured. Add EXPO_PUBLIC_GROQ_API_KEY in aipos/.env and restart.</Text>
        </View>
      )}

      {/* Conversation */}
      <ScrollView
        ref={scrollRef}
        style={S.scroll}
        contentContainerStyle={S.scrollContent}
        showsVerticalScrollIndicator={false}>
        {history.length === 0 ? (
          <View style={S.empty}>
            <Text style={[S.emptyTitle, { color: isDark ? 'rgba(255,255,255,0.75)' : '#1A0F2E' }]}>Ghost AGI is ready</Text>
            <Text style={[S.emptySub, { color: isDark ? 'rgba(255,255,255,0.35)' : 'rgba(0,0,0,0.4)' }]}>
              {isStopped ? 'Tap Restart to begin a new conversation' : 'Tap the orb below to start speaking'}
            </Text>
          </View>
        ) : (
          history.map((entry) => (
            <View key={entry.id} style={[
              S.bubble,
              entry.speaker === 'you'
                ? [S.bubbleYou, { backgroundColor: isDark ? 'rgba(107,78,255,0.35)' : 'rgba(107,78,255,0.12)', borderColor: isDark ? 'rgba(157,138,255,0.3)' : 'rgba(107,78,255,0.25)' }]
                : [S.bubbleGhost, { backgroundColor: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(255,255,255,0.85)', borderColor: isDark ? 'rgba(255,255,255,0.12)' : 'rgba(0,0,0,0.08)' }],
            ]}>
              <Text style={[S.bubbleAgent, { color: entry.speaker === 'you' ? (isDark ? 'rgba(255,255,255,0.45)' : '#6B4EFF') : '#9D8AFF' }]}>
                {entry.speaker === 'you' ? 'You' : 'Ghost AGI'}
              </Text>
              <Text style={[S.bubbleText, { color: isDark ? '#fff' : '#1A0F2E' }]}>
                {entry.text}
              </Text>
              <Text style={[S.bubbleTime, { color: isDark ? 'rgba(255,255,255,0.3)' : 'rgba(0,0,0,0.3)' }]}>{timeLabel(entry.timestamp)}</Text>
            </View>
          ))
        )}
      </ScrollView>

      {/* Orb + controls — fixed at bottom */}
      <View style={[S.bottom, { paddingBottom: insets.bottom + 90 }]}>
        <Pressable
          onPress={isStopped ? restartSession : (isActive ? undefined : startListening)}
          disabled={isActive && !isStopped}
          style={({ pressed }) => ({ transform: [{ scale: pressed ? 0.93 : 1 }] })}>
          <ConvOrb status={status} />
        </Pressable>

        {/* Voice history link */}
        <Pressable style={S.historyBtn} onPress={() => router.push('/voice-history')}>
          <Icon name="list" size={14} color={isDark ? 'rgba(255,255,255,0.5)' : 'rgba(0,0,0,0.4)'} />
          <Text style={[S.historyText, { color: isDark ? 'rgba(255,255,255,0.4)' : 'rgba(0,0,0,0.4)' }]}>All conversations</Text>
        </Pressable>

        {/* Quick commands */}
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={S.chips}>
          {[
            { label: 'Book cab',  cmd: 'book cab to station' },
            { label: 'Text Mom',  cmd: "text Mom I'm on my way" },
            { label: 'Weather',   cmd: 'what is the weather in Nellore today' },
            { label: 'Remind me', cmd: 'remind me to drink water every hour' },
            { label: 'Summarise', cmd: 'summarise my recent activity' },
          ].map((q) => (
            <Pressable
              key={q.cmd}
              style={[S.chip, {
                backgroundColor: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(107,78,255,0.1)',
                borderColor: isDark ? 'rgba(255,255,255,0.18)' : 'rgba(107,78,255,0.25)',
                opacity: isActive || isStopped ? 0.3 : 1,
              }]}
              onPress={() => { if (!isActive && !isStopped) processUtterance(q.cmd); }}
              disabled={isActive || isStopped}>
              <Text style={[S.chipText, { color: isDark ? 'rgba(255,255,255,0.8)' : '#6B4EFF' }]}>{q.label}</Text>
            </Pressable>
          ))}
        </ScrollView>
      </View>
    </View>
  );
}

const S = StyleSheet.create({
  root: { flex: 1 },
  header: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingBottom: 10 },
  hBtn: { width: 36, height: 36, borderRadius: 18, backgroundColor: 'rgba(255,255,255,0.1)', alignItems: 'center', justifyContent: 'center' },
  hCenter: { flex: 1, alignItems: 'center' },
  hTitle: { color: '#fff', fontSize: 17, fontWeight: '800' },
  statusRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 3 },
  statusDot: { width: 6, height: 6, borderRadius: 3 },
  statusText: { color: 'rgba(255,255,255,0.6)', fontSize: 12, fontWeight: '600' },
  forceStopBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 5,
    backgroundColor: '#FF4D4D',
    paddingHorizontal: 12, paddingVertical: 7,
    borderRadius: 16,
    elevation: 4, shadowColor: '#FF4D4D', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.5, shadowRadius: 6,
  },
  forceStopText: { color: '#fff', fontSize: 11, fontWeight: '800' },
  apiBanner: { marginHorizontal: 16, marginBottom: 8, backgroundColor: 'rgba(255,138,122,0.2)', borderRadius: 12, padding: 10, borderWidth: 1, borderColor: '#FF8A7A' },
  apiBannerText: { color: '#FF8A7A', fontSize: 12, fontWeight: '600', textAlign: 'center' },
  scroll: { flex: 1 },
  scrollContent: { paddingHorizontal: 16, paddingTop: 8, paddingBottom: 260 },
  empty: { alignItems: 'center', marginTop: 50, gap: 10 },
  emptyTitle: { color: 'rgba(255,255,255,0.75)', fontSize: 18, fontWeight: '700', textAlign: 'center' },
  emptySub: { color: 'rgba(255,255,255,0.35)', fontSize: 14, textAlign: 'center', paddingHorizontal: 20 },
  bubble: { borderRadius: 20, padding: 14, marginBottom: 10, maxWidth: '85%' },
  bubbleYou: { backgroundColor: 'rgba(107,78,255,0.35)', alignSelf: 'flex-end', borderWidth: 1, borderColor: 'rgba(157,138,255,0.3)' },
  bubbleGhost: { backgroundColor: 'rgba(255,255,255,0.08)', alignSelf: 'flex-start', borderWidth: 1, borderColor: 'rgba(255,255,255,0.12)' },
  bubbleAgent: { fontSize: 10, fontWeight: '800', letterSpacing: 0.5, marginBottom: 5 },
  bubbleText: { color: '#fff', fontSize: 16, lineHeight: 24 },
  bubbleTextGhost: { color: 'rgba(255,255,255,0.9)' },
  bubbleTime: { fontSize: 10, marginTop: 6, textAlign: 'right', color: 'rgba(255,255,255,0.3)' },
  bottom: {
    position: 'absolute',
    left: 0, right: 0, bottom: 0,
    alignItems: 'center',
    paddingTop: 8,
    backgroundColor: 'transparent',
  },
  historyBtn: { flexDirection: 'row', alignItems: 'center', gap: 5, marginTop: 4, marginBottom: 2 },
  historyText: { color: 'rgba(255,255,255,0.4)', fontSize: 12, fontWeight: '600' },
  chips: { paddingHorizontal: 16, gap: 8, paddingTop: 8 },
  chip: { backgroundColor: 'rgba(255,255,255,0.1)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.18)', paddingHorizontal: 16, paddingVertical: 9, borderRadius: 20 },
  chipText: { color: 'rgba(255,255,255,0.8)', fontSize: 13, fontWeight: '600' },
});
