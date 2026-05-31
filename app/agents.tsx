/**
 * Agents Page — manage Ghost AGI agents
 * Shows each agent with 3D-style card, enable/disable toggle, provider info
 */
import { Icon } from '@/components/Icon';
import { getAgentProviders } from '@/lib/agents';
import { agentConfigStorage, prefsStorage, type AgentConfig } from '@/lib/storage';
import { useTheme } from '@/lib/themeContext';
import * as Haptics from 'expo-haptics';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import * as Speech from 'expo-speech';
import { useEffect, useRef, useState } from 'react';
import {
    Animated,
    Pressable,
    ScrollView,
    StatusBar,
    StyleSheet,
    Switch,
    Text,
    View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

// 3D animated agent card
function AgentCard({ agent, onToggle }: { agent: AgentConfig; onToggle: (id: string, v: boolean) => void }) {
  const { colors: C, isDark } = useTheme();
  const pulse = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (!agent.enabled) { pulse.setValue(0); return; }
    const loop = Animated.loop(Animated.sequence([
      Animated.timing(pulse, { toValue: 1, duration: 2000, useNativeDriver: true }),
      Animated.timing(pulse, { toValue: 0, duration: 2000, useNativeDriver: true }),
    ]));
    loop.start();
    return () => loop.stop();
  }, [agent.enabled, pulse]);

  const glowOpacity = pulse.interpolate({ inputRange: [0, 1], outputRange: [0.2, 0.6] });
  const glowScale   = pulse.interpolate({ inputRange: [0, 1], outputRange: [1, 1.15] });

  const providers = getAgentProviders();
  const isLive = agent.provider === 'groq' ? providers.groq : providers.openai;

  return (
    <View style={cardS.wrap}>
      {/* 3D depth layers */}
      <View style={[cardS.layer2, { backgroundColor: agent.color + '33' }]} />
      <View style={[cardS.layer1, { backgroundColor: agent.color + '22' }]} />

      <LinearGradient
        colors={isDark ? ['#2A2540', '#1A1628'] : ['#FFFFFF', '#F5F2FF']}
        style={[cardS.card, { borderColor: agent.color + '44' }]}>

        {/* Glow orb */}
        <Animated.View style={[cardS.glow, {
          backgroundColor: agent.color,
          opacity: glowOpacity,
          transform: [{ scale: glowScale }],
        }]} />

        {/* Agent icon */}
        <View style={cardS.topRow}>
          <LinearGradient colors={[agent.color + 'CC', agent.color]} style={cardS.iconCircle}>
            <Text style={cardS.iconEmoji}>
              {agent.provider === 'groq' ? '⚡' : '✦'}
            </Text>
          </LinearGradient>

          <View style={cardS.titleCol}>
            <Text style={[cardS.name, { color: C.text }]}>{agent.name}</Text>
            <View style={[cardS.providerBadge, { backgroundColor: agent.color + '22' }]}>
              <View style={[cardS.liveDot, { backgroundColor: isLive ? '#6EE7A0' : '#FF8A7A' }]} />
              <Text style={[cardS.providerText, { color: agent.color }]}>
                {agent.provider === 'groq' ? 'GROQ' : 'OPENAI'} · {isLive ? 'Key set' : 'Key missing'}
              </Text>
            </View>
          </View>

          <Switch
            value={agent.enabled}
            onValueChange={(v) => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              onToggle(agent.id, v);
            }}
            trackColor={{ false: C.border, true: agent.color + '88' }}
            thumbColor={agent.enabled ? agent.color : C.textLight}
          />
        </View>

        <Text style={[cardS.role, { color: agent.color }]}>{agent.role}</Text>
        <Text style={[cardS.desc, { color: C.textMid }]}>{agent.description}</Text>

        <View style={[cardS.statusBar, { backgroundColor: agent.enabled ? agent.color + '18' : C.border + '44' }]}>
          <View style={[cardS.statusDot, { backgroundColor: agent.enabled ? '#6EE7A0' : C.textLight }]} />
          <Text style={[cardS.statusText, { color: agent.enabled ? '#6EE7A0' : C.textLight }]}>
            {agent.enabled ? 'Active — will process requests' : 'Disabled — skipped in pipeline'}
          </Text>
        </View>
      </LinearGradient>
    </View>
  );
}

const cardS = StyleSheet.create({
  wrap: { marginHorizontal: 16, marginBottom: 20 },
  layer2: { position: 'absolute', left: 10, right: -8, top: 10, bottom: -8, borderRadius: 22 },
  layer1: { position: 'absolute', left: 5, right: -4, top: 5, bottom: -4, borderRadius: 22 },
  card: {
    borderRadius: 22, padding: 18, borderWidth: 1.5,
    overflow: 'hidden', elevation: 10,
    shadowColor: '#000', shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.2, shadowRadius: 16,
  },
  glow: { position: 'absolute', width: 100, height: 100, borderRadius: 50, top: -30, right: -20 },
  topRow: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 12, zIndex: 2 },
  iconCircle: { width: 52, height: 52, borderRadius: 26, alignItems: 'center', justifyContent: 'center', elevation: 6 },
  iconEmoji: { fontSize: 24 },
  titleCol: { flex: 1 },
  name: { fontSize: 17, fontWeight: '800', marginBottom: 4 },
  providerBadge: { flexDirection: 'row', alignItems: 'center', gap: 5, paddingHorizontal: 8, paddingVertical: 3, borderRadius: 10, alignSelf: 'flex-start' },
  liveDot: { width: 6, height: 6, borderRadius: 3 },
  providerText: { fontSize: 10, fontWeight: '700' },
  role: { fontSize: 12, fontWeight: '700', marginBottom: 6, zIndex: 2 },
  desc: { fontSize: 13, lineHeight: 19, marginBottom: 12, zIndex: 2 },
  statusBar: { flexDirection: 'row', alignItems: 'center', gap: 8, padding: 10, borderRadius: 12 },
  statusDot: { width: 7, height: 7, borderRadius: 4 },
  statusText: { fontSize: 12, fontWeight: '600' },
});

export default function AgentsScreen() {
  const insets = useSafeAreaInsets();
  const { colors: C, isDark } = useTheme();
  const [agents, setAgents] = useState<AgentConfig[]>([]);
  const [voiceGender, setVoiceGender] = useState<'male' | 'female'>('male');
  const [playingVoice, setPlayingVoice] = useState<'male' | 'female' | null>(null);

  useEffect(() => {
    agentConfigStorage.list().then(setAgents);
    prefsStorage.get().then((p) => {
      const saved = (p as any).voiceGender as 'male' | 'female' | undefined;
      if (saved) setVoiceGender(saved);
    });
  }, []);

  const handleToggle = async (id: string, enabled: boolean) => {
    await agentConfigStorage.setEnabled(id, enabled);
    setAgents((prev) => prev.map((a) => a.id === id ? { ...a, enabled } : a));
  };

  const handleReset = async () => {
    await agentConfigStorage.reset();
    const fresh = await agentConfigStorage.list();
    setAgents(fresh);
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
  };

  const previewVoice = (g: 'male' | 'female') => {
    Speech.stop();
    setPlayingVoice(g);
    Speech.speak(
      g === 'male'
        ? "Hello, I'm Ghost. Your personal AGI assistant."
        : "Hi there! I'm Ghost, ready to help you with anything.",
      {
        language: 'en-IN',
        pitch: g === 'male' ? 0.75 : 1.25,
        rate: 0.9,
        onDone: () => setPlayingVoice(null),
        onStopped: () => setPlayingVoice(null),
      },
    );
  };

  const saveVoice = async (g: 'male' | 'female') => {
    setVoiceGender(g);
    const prefs = await prefsStorage.get();
    await prefsStorage.set({ ...prefs, voiceGender: g } as any);
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
  };

  return (
    <View style={[S.root, { paddingTop: insets.top }]}>
      <StatusBar barStyle={isDark ? 'light-content' : 'dark-content'} />
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 120 }}>

        {/* Header */}
        <View style={S.header}>
          <Pressable style={S.backBtn} onPress={() => router.back()}>
            <Icon name="back" size={20} color={C.text} />
          </Pressable>
          <View style={{ flex: 1 }}>
            <Text style={[S.title, { color: C.text }]}>AGI Agents</Text>
            <Text style={[S.subtitle, { color: C.textMid }]}>
              {agents.filter((a) => a.enabled).length} of {agents.length} active
            </Text>
          </View>
          <Pressable style={[S.resetBtn, { backgroundColor: C.surface, borderColor: C.border }]} onPress={handleReset}>
            <Icon name="activity" size={14} color={C.textMid} />
            <Text style={[S.resetText, { color: C.textMid }]}>Reset</Text>
          </Pressable>
        </View>

        {/* Info banner */}
        <View style={[S.infoBanner, { backgroundColor: '#9D8AFF18', borderColor: '#9D8AFF44' }]}>
          <Icon name="zap" size={14} color="#9D8AFF" />
          <Text style={[S.infoText, { color: C.textMid }]}>
            Multiple agents can run simultaneously. Ghost tries Groq first, then OpenAI as fallback.
          </Text>
        </View>

        {/* Agent cards */}
        {agents.map((agent) => (
          <AgentCard key={agent.id} agent={agent} onToggle={handleToggle} />
        ))}

        {/* Voice type section — inline picker */}
        <View style={[S.section, { backgroundColor: C.surface, borderColor: C.border }]}>
          <Text style={[S.sectionTitle, { color: C.text }]}>Voice Type</Text>
          <Text style={[S.sectionHint, { color: C.textMid }]}>Tap preview to hear, then select to save</Text>
          <View style={vS.row}>
            {(['male', 'female'] as const).map((g) => {
              const active = voiceGender === g;
              return (
                <View key={g} style={vS.cardWrap}>
                  <LinearGradient
                    colors={g === 'male'
                      ? (active ? ['#3D2B8E', '#6B4EFF'] : [C.surface, C.surfaceAlt])
                      : (active ? ['#8E2B6B', '#FF7EB6'] : [C.surface, C.surfaceAlt])}
                    style={[vS.card, { borderColor: active ? (g === 'male' ? '#9D8AFF' : '#FF7EB6') : C.border }]}>
                    {/* Icon */}
                    <View style={[vS.iconCircle, { borderColor: active ? '#fff' : C.border, backgroundColor: active ? 'rgba(255,255,255,0.15)' : C.bg }]}>
                      <Icon name="mic" size={22} color={active ? '#fff' : C.textMid} />
                    </View>
                    <Text style={[vS.label, { color: active ? '#fff' : C.text }]}>
                      {g === 'male' ? 'Male' : 'Female'}
                    </Text>
                    <Text style={[vS.desc, { color: active ? 'rgba(255,255,255,0.7)' : C.textMid }]}>
                      {g === 'male' ? 'Deep & clear' : 'Warm & natural'}
                    </Text>
                    <Pressable
                      style={[vS.previewBtn, { backgroundColor: active ? 'rgba(255,255,255,0.2)' : C.border }]}
                      onPress={() => previewVoice(g)}>
                      <Icon name={playingVoice === g ? 'activity' : 'forward'} size={12} color={active ? '#fff' : C.textMid} />
                      <Text style={[vS.previewText, { color: active ? '#fff' : C.textMid }]}>
                        {playingVoice === g ? 'Playing…' : 'Preview'}
                      </Text>
                    </Pressable>
                    <Pressable
                      style={[vS.selectBtn, { backgroundColor: active ? '#fff' : C.violet }]}
                      onPress={() => saveVoice(g)}>
                      <Text style={[vS.selectText, { color: active ? '#1A0F2E' : '#fff' }]}>
                        {active ? '✓ Selected' : 'Select'}
                      </Text>
                    </Pressable>
                  </LinearGradient>
                </View>
              );
            })}
          </View>
        </View>

      </ScrollView>
    </View>
  );
}

const S = StyleSheet.create({
  root: { flex: 1 },
  header: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingHorizontal: 16, paddingTop: 8, paddingBottom: 20 },
  backBtn: { width: 36, height: 36, borderRadius: 18, alignItems: 'center', justifyContent: 'center' },
  title: { fontSize: 26, fontWeight: '900' },
  subtitle: { fontSize: 13, marginTop: 2 },
  resetBtn: { flexDirection: 'row', alignItems: 'center', gap: 5, paddingHorizontal: 12, paddingVertical: 7, borderRadius: 16, borderWidth: 1 },
  resetText: { fontSize: 12, fontWeight: '600' },
  infoBanner: { flexDirection: 'row', alignItems: 'flex-start', gap: 8, marginHorizontal: 16, marginBottom: 20, padding: 12, borderRadius: 14, borderWidth: 1 },
  infoText: { flex: 1, fontSize: 13, lineHeight: 18 },
  section: { marginHorizontal: 16, borderRadius: 20, borderWidth: 1, overflow: 'hidden', marginBottom: 16 },
  sectionTitle: { fontSize: 14, fontWeight: '800', padding: 14, paddingBottom: 4 },
  sectionHint: { fontSize: 12, paddingHorizontal: 14, paddingBottom: 12 },
  sectionRow: { flexDirection: 'row', alignItems: 'center', gap: 12, padding: 14, borderBottomWidth: 1 },
  sectionRowText: { flex: 1, fontSize: 15, fontWeight: '600' },
});

const vS = StyleSheet.create({
  row: { flexDirection: 'row', gap: 10, padding: 12, paddingTop: 0 },
  cardWrap: { flex: 1, borderRadius: 18, overflow: 'hidden', elevation: 4, shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.15, shadowRadius: 10 },
  card: { padding: 16, alignItems: 'center', gap: 6, borderWidth: 1.5, borderRadius: 18 },
  iconCircle: { width: 52, height: 52, borderRadius: 26, borderWidth: 2, alignItems: 'center', justifyContent: 'center', marginBottom: 2 },
  label: { fontSize: 16, fontWeight: '800' },
  desc: { fontSize: 11, textAlign: 'center' },
  previewBtn: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 12, paddingVertical: 6, borderRadius: 12, marginTop: 4 },
  previewText: { fontSize: 11, fontWeight: '700' },
  selectBtn: { paddingHorizontal: 20, paddingVertical: 8, borderRadius: 16, marginTop: 4 },
  selectText: { fontSize: 13, fontWeight: '800' },
});
