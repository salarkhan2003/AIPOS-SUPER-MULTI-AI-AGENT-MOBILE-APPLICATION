import { ClayButton } from '@/components/clay';
import { Icon } from '@/components/Icon';
import { finishOnboardingWithNickname } from '@/lib/auth';
import { useColors, useTheme } from '@/lib/themeContext';
import { useGhostStore } from '@/store/ghostStore';
import { router } from 'expo-router';
import { useMemo, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Dimensions,
  FlatList,
  NativeScrollEvent,
  NativeSyntheticEvent,
  StatusBar,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

const { width: SCREEN_W } = Dimensions.get('window');

type Slide =
  | { id: string; type: 'welcome' }
  | { id: string; type: 'agents' }
  | { id: string; type: 'privacy' }
  | { id: string; type: 'nickname' };

const SLIDES: Slide[] = [
  { id: '1', type: 'welcome' },
  { id: '2', type: 'agents' },
  { id: '3', type: 'privacy' },
  { id: '4', type: 'nickname' },
];

export default function OnboardingScreen() {
  const insets = useSafeAreaInsets();
  const C = useColors();
  const { isDark } = useTheme();
  const styles = useMemo(() => makeStyles(C), [C]);
  const setOnboarded = useGhostStore((s) => s.setOnboarded);
  const setAuth = useGhostStore((s) => s.setAuth);

  const listRef = useRef<FlatList<Slide>>(null);
  const [page, setPage] = useState(0);
  const [nickname, setNickname] = useState('');
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);

  const isLast = page === SLIDES.length - 1;

  const onScroll = (e: NativeSyntheticEvent<NativeScrollEvent>) => {
    const i = Math.round(e.nativeEvent.contentOffset.x / SCREEN_W);
    if (i !== page) setPage(i);
  };

  const goNext = () => {
    if (isLast) {
      void finishSetup();
      return;
    }
    listRef.current?.scrollToIndex({ index: page + 1, animated: true });
    setPage(page + 1);
  };

  const finishSetup = async () => {
    const name = nickname.trim();
    if (!name) {
      setError('Please enter a nickname to continue');
      return;
    }
    setError('');
    setSaving(true);
    try {
      await finishOnboardingWithNickname(name);
      setOnboarded(true);
      setAuth({ isGuest: true, isAuthenticated: false, name, email: '' });
      router.replace('/(tabs)');
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Could not save. Try again.');
    } finally {
      setSaving(false);
    }
  };

  const renderSlide = ({ item }: { item: Slide }) => {
    if (item.type === 'welcome') {
      return (
        <View style={[styles.slide, { width: SCREEN_W }]}>
          <View style={styles.logoWrap}>
            <Icon name="brain" size={44} color="#fff" />
          </View>
          <Text style={styles.logo}>GHOST</Text>
          <Text style={styles.slideTitle}>Welcome to your AI OS</Text>
          <Text style={styles.slideBody}>
            Ghost runs eight specialized agents on your phone — planning, executing, and remembering for you.
          </Text>
        </View>
      );
    }
    if (item.type === 'agents') {
      const feats = [
        { icon: 'network' as const, color: C.violet, text: 'Planner, Executor, Research & more' },
        { icon: 'zap' as const, color: C.coral, text: 'Real actions: WhatsApp, Uber, reminders' },
        { icon: 'memory' as const, color: C.mint, text: 'Memory that persists across sessions' },
      ];
      return (
        <View style={[styles.slide, { width: SCREEN_W }]}>
          <Text style={styles.slideTitle}>Multi-agent command center</Text>
          <Text style={styles.slideBody}>Each agent has a role. You speak naturally — Ghost coordinates the rest.</Text>
          <View style={styles.featureList}>
            {feats.map((f) => (
              <View key={f.text} style={styles.featureRow}>
                <View style={[styles.featureIcon, { backgroundColor: f.color + '22' }]}>
                  <Icon name={f.icon} size={20} color={f.color} />
                </View>
                <Text style={styles.featureText}>{f.text}</Text>
              </View>
            ))}
          </View>
        </View>
      );
    }
    if (item.type === 'privacy') {
      return (
        <View style={[styles.slide, { width: SCREEN_W }]}>
          <Text style={styles.slideTitle}>You're in control</Text>
          <Text style={styles.slideBody}>
            Data stays on your device. Notifications, accessibility, and memory are permission-based — you decide what Ghost can do.
          </Text>
          <View style={[styles.privacyCard, { borderColor: C.border }]}>
            <Icon name="shield" size={28} color={C.mint} />
            <Text style={styles.privacyCardText}>Local-first · Encrypted memory · No cloud required</Text>
          </View>
        </View>
      );
    }
    return (
      <View style={[styles.slide, { width: SCREEN_W }]}>
        <Text style={styles.slideTitle}>What should we call you?</Text>
        <Text style={styles.slideBody}>Your nickname appears on Home and in AI conversations.</Text>
        <TextInput
          style={styles.nickInput}
          placeholder="Enter nickname"
          placeholderTextColor={C.textLight}
          value={nickname}
          onChangeText={(t) => {
            setNickname(t);
            if (error) setError('');
          }}
          autoCapitalize="words"
          maxLength={32}
          returnKeyType="done"
          onSubmitEditing={() => void finishSetup()}
        />
        {error ? <Text style={styles.err}>{error}</Text> : null}
      </View>
    );
  };

  return (
    <View style={[styles.root, { paddingTop: insets.top, paddingBottom: insets.bottom + 16 }]}>
      <StatusBar barStyle={isDark ? 'light-content' : 'dark-content'} />

      <View style={styles.strip}>
        {SLIDES.map((_, i) => (
          <View key={i} style={[styles.dot, i === page && styles.dotActive, i === page && { backgroundColor: C.violet }]} />
        ))}
      </View>

      <FlatList
        ref={listRef}
        data={SLIDES}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        onMomentumScrollEnd={onScroll}
        keyExtractor={(s) => s.id}
        renderItem={renderSlide}
        getItemLayout={(_, i) => ({ length: SCREEN_W, offset: SCREEN_W * i, index: i })}
      />

      <View style={styles.bottom}>
        {saving ? (
          <ActivityIndicator color={C.violet} size="large" />
        ) : (
          <ClayButton
            label={isLast ? 'Start Ghost' : 'Next'}
            onPress={goNext}
            disabled={isLast && !nickname.trim()}
          />
        )}
        {!isLast ? (
          <Text style={styles.stepHint}>Step {page + 1} of {SLIDES.length}</Text>
        ) : (
          <Text style={styles.legal}>Required to use Ghost AI and all features</Text>
        )}
      </View>
    </View>
  );
}

function makeStyles(C: ReturnType<typeof useColors>) {
  return StyleSheet.create({
    root: { flex: 1, backgroundColor: C.bg },
    strip: { flexDirection: 'row', justifyContent: 'center', gap: 8, paddingVertical: 12 },
    dot: { width: 8, height: 8, borderRadius: 4, backgroundColor: C.border },
    dotActive: { width: 24 },
    slide: { flex: 1, paddingHorizontal: 28, justifyContent: 'center', alignItems: 'center' },
    logoWrap: {
      width: 88,
      height: 88,
      borderRadius: 44,
      backgroundColor: C.violet,
      alignItems: 'center',
      justifyContent: 'center',
      marginBottom: 20,
      shadowColor: C.violet,
      shadowOffset: { width: 0, height: 12 },
      shadowOpacity: 0.45,
      shadowRadius: 20,
      elevation: 12,
    },
    logo: { fontSize: 36, fontWeight: '800', color: C.text, letterSpacing: 8, marginBottom: 8 },
    slideTitle: { fontSize: 24, fontWeight: '800', color: C.text, textAlign: 'center', marginBottom: 12 },
    slideBody: { fontSize: 15, color: C.textMid, textAlign: 'center', lineHeight: 22, paddingHorizontal: 8 },
    featureList: { marginTop: 28, gap: 14, alignSelf: 'stretch' },
    featureRow: { flexDirection: 'row', alignItems: 'center', gap: 14 },
    featureIcon: { width: 44, height: 44, borderRadius: 22, alignItems: 'center', justifyContent: 'center' },
    featureText: { color: C.text, flex: 1, fontSize: 15, fontWeight: '500' },
    privacyCard: {
      marginTop: 28,
      flexDirection: 'row',
      alignItems: 'center',
      gap: 14,
      padding: 18,
      borderRadius: 18,
      borderWidth: 1,
      backgroundColor: C.surface,
      alignSelf: 'stretch',
    },
    privacyCardText: { flex: 1, color: C.textMid, fontSize: 14, lineHeight: 20 },
    nickInput: {
      marginTop: 24,
      alignSelf: 'stretch',
      backgroundColor: C.surface,
      borderRadius: 16,
      borderWidth: 2,
      borderColor: C.violet,
      paddingHorizontal: 18,
      paddingVertical: 16,
      fontSize: 18,
      fontWeight: '600',
      color: C.text,
    },
    err: { color: C.coral, marginTop: 10, fontWeight: '600', textAlign: 'center' },
    bottom: { paddingHorizontal: 24, minHeight: 100, justifyContent: 'center' },
    stepHint: { color: C.textLight, textAlign: 'center', fontSize: 12, marginTop: 4 },
    legal: { color: C.textLight, textAlign: 'center', fontSize: 11, marginTop: 6 },
  });
}
