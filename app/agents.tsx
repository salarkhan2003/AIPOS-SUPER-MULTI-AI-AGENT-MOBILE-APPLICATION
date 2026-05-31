import { Icon } from '@/components/Icon';
import { ClayButton } from '@/components/clay/ClayButton';
import { ClayCard } from '@/components/clay/ClayCard';
import { ClayInput } from '@/components/clay/ClayInput';
import { getAgentProviders } from '@/lib/agents';
import { agentConfigStorage, prefsStorage, type AgentConfig } from '@/lib/storage';
import { useTheme } from '@/lib/themeContext';
import * as Haptics from 'expo-haptics';
import { router } from 'expo-router';
import * as Speech from 'expo-speech';
import { useEffect, useRef, useState } from 'react';
import {
  Animated,
  Modal,
  Pressable,
  ScrollView,
  StatusBar,
  StyleSheet,
  Switch,
  Text,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

type VoicePersonality = 'normal' | 'friendly' | 'flirty' | 'professional' | 'jokes' | 'serious';

const PERSONALITIES: {
  type: VoicePersonality;
  label: string;
  color: string;
  desc: string;
}[] = [
  { type: 'normal', label: 'Normal', color: '#6B4EFF', desc: 'Balanced and helpful' },
  { type: 'friendly', label: 'Friendly', color: '#3ECFB2', desc: 'Warm and approachable' },
  { type: 'flirty', label: 'Flirty', color: '#FF7EB6', desc: 'Playful and charming' },
  { type: 'professional', label: 'Professional', color: '#5CE1E6', desc: 'Formal and efficient' },
  { type: 'jokes', label: 'Jokes', color: '#F5C842', desc: 'Funny and entertaining' },
  { type: 'serious', label: 'Serious', color: '#FF8A7A', desc: 'Direct and focused' },
];

function AgentCard({ agent, onToggle }: { agent: AgentConfig; onToggle: (id: string, v: boolean) => void }) {
  const { colors: C } = useTheme();
  const pulse = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (!agent.enabled) {
      pulse.setValue(0);
      return;
    }
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(pulse, { toValue: 1, duration: 2000, useNativeDriver: true }),
        Animated.timing(pulse, { toValue: 0, duration: 2000, useNativeDriver: true }),
      ]),
    );
    loop.start();
    return () => loop.stop();
  }, [agent.enabled, pulse]);

  const providers = getAgentProviders();
  const isLive = agent.provider === 'groq' ? providers.groq : providers.openai;

  return (
    <ClayCard>
      <View style={cardStyles.row}>
        <View style={[cardStyles.iconCircle, { backgroundColor: agent.color }]}>
          <Text style={cardStyles.iconEmoji}>{agent.provider === 'groq' ? '⚡' : '✦'}</Text>
        </View>
        <View style={cardStyles.info}>
          <View style={cardStyles.nameRow}>
            <Text style={[cardStyles.name, { color: C.text }]}>{agent.name}</Text>
            <View style={[cardStyles.badge, { backgroundColor: agent.color + '20' }]}>
              <View style={[cardStyles.liveDot, { backgroundColor: isLive ? '#3ECFB2' : '#FF8A7A' }]} />
              <Text style={[cardStyles.badgeText, { color: agent.color }]}>
                {agent.provider === 'groq' ? 'GROQ' : 'OPENAI'}
              </Text>
            </View>
          </View>
          <Text style={[cardStyles.role, { color: C.textMid }]}>{agent.role}</Text>
        </View>
        <Switch
          value={agent.enabled}
          onValueChange={(v) => {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            onToggle(agent.id, v);
          }}
          trackColor={{ false: C.border, true: agent.color + '40' }}
          thumbColor={agent.enabled ? agent.color : C.textLight}
        />
      </View>
    </ClayCard>
  );
}

const cardStyles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  iconCircle: { width: 52, height: 52, borderRadius: 26, alignItems: 'center', justifyContent: 'center' },
  iconEmoji: { fontSize: 22, color: '#fff' },
  info: { flex: 1 },
  nameRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 4 },
  name: { fontSize: 16, fontWeight: '800' },
  badge: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12 },
  liveDot: { width: 6, height: 6, borderRadius: 3 },
  badgeText: { fontSize: 11, fontWeight: '800' },
  role: { fontSize: 13, fontWeight: '500' },
});

function VoicePersonalityBox({
  selected,
  personality,
  onPress,
}: {
  selected: boolean;
  personality: typeof PERSONALITIES[0];
  onPress: () => void;
}) {
  const { colors: C } = useTheme();

  return (
    <Pressable
      style={[vpStyles.box, { backgroundColor: selected ? personality.color : C.surface, borderColor: personality.color }]}
      onPress={onPress}
    >
      <View style={[vpStyles.iconWrap, { backgroundColor: selected ? 'rgba(255,255,255,0.2)' : personality.color + '20' }]}>
        <Icon name="mic" size={20} color={selected ? '#fff' : personality.color} />
      </View>
      <Text style={[vpStyles.label, { color: selected ? '#fff' : C.text }]}>{personality.label}</Text>
      <Text style={[vpStyles.desc, { color: selected ? 'rgba(255,255,255,0.85)' : C.textMid }]} numberOfLines={2}>{personality.desc}</Text>
    </Pressable>
  );
}

const vpStyles = StyleSheet.create({
  box: { flex: 1, borderRadius: 20, padding: 16, borderWidth: 2, alignItems: 'center', gap: 10, elevation: 3, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.08, shadowRadius: 8 },
  iconWrap: { width: 50, height: 50, borderRadius: 25, alignItems: 'center', justifyContent: 'center' },
  label: { fontSize: 15, fontWeight: '800' },
  desc: { fontSize: 12, textAlign: 'center' },
});

function CreateModal({ type, onClose }: { type: 'task' | 'meeting' | 'deadline'; onClose: () => void }) {
  const { colors: C } = useTheme();
  const [title, setTitle] = useState('');
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    if (!title.trim()) return;
    setSaving(true);
    await new Promise(r => setTimeout(r, 500));
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    setSaving(false);
    onClose();
  };

  return (
    <Modal visible transparent animationType="fade" onRequestClose={onClose}>
      <View style={modalStyles.backdrop}>
        <ClayCard style={{ width: '90%', borderRadius: 24 }}>
          <View style={modalStyles.header}>
            <Text style={[modalStyles.title, { color: C.text }]}>
              New {type.charAt(0).toUpperCase() + type.slice(1)}
            </Text>
            <Pressable onPress={onClose} style={modalStyles.closeBtn}>
              <Icon name="x" size={24} color={C.textMid} />
            </Pressable>
          </View>
          <ClayInput
            placeholder="Enter title..."
            value={title}
            onChangeText={setTitle}
            autoFocus
          />
          <View style={modalStyles.buttons}>
            <ClayButton
              label="Cancel"
              variant="ghost"
              onPress={onClose}
              style={{ flex: 1 }}
            />
            <ClayButton
              label={saving ? 'Saving...' : 'Create'}
              onPress={handleSave}
              style={{ flex: 1, marginLeft: 10 }}
              disabled={saving || !title.trim()}
            />
          </View>
        </ClayCard>
      </View>
    </Modal>
  );
}

const modalStyles = StyleSheet.create({
  backdrop: { flex: 1, backgroundColor: 'rgba(0,0,0,0.6)', justifyContent: 'center', alignItems: 'center', padding: 20 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 },
  title: { fontSize: 20, fontWeight: '800' },
  closeBtn: { width: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center' },
  buttons: { flexDirection: 'row', marginTop: 20 },
});

export default function AgentsScreen() {
  const insets = useSafeAreaInsets();
  const { colors: C } = useTheme();
  const [agents, setAgents] = useState<AgentConfig[]>([]);
  const [voiceGender, setVoiceGender] = useState<'male' | 'female'>('male');
  const [playingVoice, setPlayingVoice] = useState<'male' | 'female' | null>(null);
  const [bgVoice, setBgVoice] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState<'task' | 'meeting' | 'deadline' | null>(null);
  const [selectedPersonality, setSelectedPersonality] = useState<VoicePersonality>('normal');

  useEffect(() => {
    agentConfigStorage.list().then(setAgents);
    prefsStorage.get().then((p) => {
      const savedGender = (p as any).voiceGender as 'male' | 'female' | undefined;
      if (savedGender) setVoiceGender(savedGender);
      setBgVoice(p.backgroundVoiceAgentEnabled);
      const savedPers = (p as any).voicePersonality as VoicePersonality | undefined;
      if (savedPers) setSelectedPersonality(savedPers);
    });
  }, []);

  const savePersonality = async (type: VoicePersonality) => {
    setSelectedPersonality(type);
    const prefs = await prefsStorage.get();
    await prefsStorage.set({ ...prefs, voicePersonality: type } as any);
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
  };

  const handleToggle = async (id: string, enabled: boolean) => {
    await agentConfigStorage.setEnabled(id, enabled);
    setAgents((prev) => prev.map((a) => (a.id === id ? { ...a, enabled } : a)));
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
        ? "Hey, what's up? I'm Ghost, your personal AI assistant. Let's make today amazing!"
        : "Hi there! I'm Ghost, ready to help you with anything. You look great today!",
      {
        language: 'en-IN',
        pitch: g === 'male' ? 0.7 : 1.25,
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

  const toggleBgVoice = async () => {
    const newVal = !bgVoice;
    setBgVoice(newVal);
    const prefs = await prefsStorage.get();
    await prefsStorage.set({ ...prefs, backgroundVoiceAgentEnabled: newVal });
  };

  const quickItems = [
    { id: 'task' as const, label: 'Task', icon: 'check-square' as const, color: '#3ECFB2' },
    { id: 'meeting' as const, label: 'Meeting', icon: 'calendar' as const, color: '#6B4EFF' },
    { id: 'deadline' as const, label: 'Deadline', icon: 'clock' as const, color: '#FF8A7A' },
  ];

  return (
    <View style={[styles.root, { backgroundColor: C.bg }]}>
      <StatusBar barStyle="light-content" />

      <ScrollView style={styles.scroll} contentContainerStyle={{ paddingBottom: insets.bottom + 24, paddingHorizontal: 16, paddingTop: insets.top + 8 }}>
        <View style={styles.header}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
            <Pressable onPress={() => router.back()} style={[styles.backBtn, { backgroundColor: C.surface }]}>
              <Icon name="back" size={20} color={C.text} />
            </Pressable>
            <View>
              <Text style={[styles.title, { color: C.text }]}>Agents</Text>
              <Text style={[styles.subtitle, { color: C.textMid }]}>Configure your AI team</Text>
            </View>
          </View>
          <Pressable style={[styles.resetBtn, { backgroundColor: C.surface }]} onPress={handleReset}>
            <Icon name="refresh-ccw" size={20} color={C.textMid} />
          </Pressable>
        </View>

        <ClayCard>
          <Text style={[styles.sectionTitle, { color: C.text, marginBottom: 12 }]}>Quick Create</Text>
          <View style={styles.quickRow}>
            {quickItems.map((item) => (
              <Pressable
                key={item.id}
                style={[styles.quickItem, { backgroundColor: item.color + '20' }]}
                onPress={() => setShowCreateModal(item.id)}
              >
                <Icon name={item.icon} size={22} color={item.color} />
                <Text style={[styles.quickLabel, { color: C.text }]}>{item.label}</Text>
              </Pressable>
            ))}
          </View>
        </ClayCard>

        <ClayCard>
          <View style={styles.toggleRow}>
            <View style={[styles.toggleIcon, { backgroundColor: '#F5C842' + '20' }]}>
              <Icon name="mic" size={22} color="#F5C842" />
            </View>
            <View style={styles.toggleInfo}>
              <Text style={[styles.toggleLabel, { color: C.text }]}>Background Voice</Text>
              <Text style={[styles.toggleDesc, { color: C.textMid }]}>Greets you when app opens</Text>
            </View>
            <Switch value={bgVoice} onValueChange={toggleBgVoice} trackColor={{ false: C.border, true: '#F5C842' + '40' }} thumbColor={bgVoice ? '#F5C842' : C.textLight} />
          </View>
        </ClayCard>

        <Text style={[styles.sectionTitle, { color: C.text, marginTop: 24, marginBottom: 12 }]}>Voice Personality</Text>
        <View style={styles.personalityGrid}>
          {PERSONALITIES.map((pers, idx) => (
            <View key={pers.type} style={[styles.personalityCol, idx % 2 === 0 ? { paddingRight: 6 } : { paddingLeft: 6 }]}>
              <VoicePersonalityBox
                personality={pers}
                selected={selectedPersonality === pers.type}
                onPress={() => savePersonality(pers.type)}
              />
            </View>
          ))}
        </View>

        <Text style={[styles.sectionTitle, { color: C.text, marginTop: 24, marginBottom: 12 }]}>Voice Gender</Text>
        <View style={styles.genderRow}>
          <Pressable
            style={[styles.genderBtn, { backgroundColor: voiceGender === 'male' ? C.violet : C.surface, borderColor: C.violet }]}
            onPress={() => { previewVoice('male'); saveVoice('male'); }}
          >
            <Icon name="user" size={22} color={voiceGender === 'male' ? '#fff' : C.violet} />
            <Text style={[styles.genderLabel, { color: voiceGender === 'male' ? '#fff' : C.text }]}>Male</Text>
            {playingVoice === 'male' && <Icon name="volume-2" size={18} color="#fff" />}
          </Pressable>
          <Pressable
            style={[styles.genderBtn, { backgroundColor: voiceGender === 'female' ? C.violet : C.surface, borderColor: C.violet }]}
            onPress={() => { previewVoice('female'); saveVoice('female'); }}
          >
            <Icon name="user" size={22} color={voiceGender === 'female' ? '#fff' : C.violet} />
            <Text style={[styles.genderLabel, { color: voiceGender === 'female' ? '#fff' : C.text }]}>Female</Text>
            {playingVoice === 'female' && <Icon name="volume-2" size={18} color="#fff" />}
          </Pressable>
        </View>

        <Text style={[styles.sectionTitle, { color: C.text, marginTop: 24, marginBottom: 12 }]}>Your AI Agents</Text>
        {agents.map((agent) => (
          <AgentCard key={agent.id} agent={agent} onToggle={handleToggle} />
        ))}

        <View style={styles.linksRow}>
          <Pressable onPress={() => router.push('/permissions')}>
            <Text style={[styles.linkText, { color: C.textMid }]}>Permissions</Text>
          </Pressable>
          <Pressable onPress={() => router.push('/settings')}>
            <Text style={[styles.linkText, { color: C.textMid }]}>Settings</Text>
          </Pressable>
        </View>
      </ScrollView>

      {showCreateModal && (
        <CreateModal
          type={showCreateModal}
          onClose={() => setShowCreateModal(null)}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  scroll: { flex: 1 },
  backBtn: { width: 44, height: 44, borderRadius: 22, alignItems: 'center', justifyContent: 'center', elevation: 2, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.08, shadowRadius: 6 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 20 },
  title: { fontSize: 28, fontWeight: '900', letterSpacing: -0.5 },
  subtitle: { fontSize: 14, fontWeight: '500' },
  resetBtn: { width: 44, height: 44, borderRadius: 22, alignItems: 'center', justifyContent: 'center', elevation: 2, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.08, shadowRadius: 6 },
  sectionTitle: { fontSize: 16, fontWeight: '800', letterSpacing: 0.3 },
  quickRow: { flexDirection: 'row', gap: 10 },
  quickItem: { flex: 1, alignItems: 'center', gap: 8, paddingVertical: 14, borderRadius: 16 },
  quickLabel: { fontSize: 13, fontWeight: '700' },
  toggleRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  toggleIcon: { width: 50, height: 50, borderRadius: 25, alignItems: 'center', justifyContent: 'center' },
  toggleInfo: { flex: 1 },
  toggleLabel: { fontSize: 15, fontWeight: '700', marginBottom: 2 },
  toggleDesc: { fontSize: 13, fontWeight: '500' },
  personalityGrid: { flexDirection: 'row', flexWrap: 'wrap' },
  personalityCol: { width: '50%', marginBottom: 12 },
  genderRow: { flexDirection: 'row', gap: 12 },
  genderBtn: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10, paddingVertical: 16, borderRadius: 18, borderWidth: 2, elevation: 3, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.08, shadowRadius: 8 },
  genderLabel: { fontSize: 16, fontWeight: '800' },
  linksRow: { flexDirection: 'row', gap: 24, marginTop: 20, justifyContent: 'center' },
  linkText: { fontSize: 14, fontWeight: '600' },
});
