import { Icon } from '@/components/Icon';
import type { ColorPalette } from '@/lib/themeContext';
import { LinearGradient } from 'expo-linear-gradient';
import { useEffect, useRef } from 'react';
import { Animated, StyleSheet, Text, View } from 'react-native';

/** Visible 3D hub header — always shown at top of Neural Log */
export function NeuralLog3DHub({
  C,
  isDark,
  thoughtCount,
  agentCount,
}: {
  C: ColorPalette;
  isDark: boolean;
  thoughtCount: number;
  agentCount: number;
}) {
  const pulse = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(pulse, { toValue: 1, duration: 2200, useNativeDriver: true }),
        Animated.timing(pulse, { toValue: 0, duration: 2200, useNativeDriver: true }),
      ]),
    );
    loop.start();
    return () => loop.stop();
  }, [pulse]);

  const glowScale = pulse.interpolate({ inputRange: [0, 1], outputRange: [1, 1.08] });
  const glowOpacity = pulse.interpolate({ inputRange: [0, 1], outputRange: [0.35, 0.75] });

  return (
    <View style={styles.wrap}>
      {/* Back depth layers */}
      <View style={[styles.layer3, { backgroundColor: C.coral + (isDark ? '55' : '35') }]} />
      <View style={[styles.layer2, { backgroundColor: C.mint + (isDark ? '50' : '30') }]} />
      <View style={[styles.layer1, { backgroundColor: C.violet + (isDark ? '60' : '40') }]} />

      <LinearGradient
        colors={isDark ? ['#2A2540', '#1A1628', '#12101A'] : ['#FFFFFF', '#F5F2FF', '#EDE8FF']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={[styles.mainCard, { borderColor: C.violet + '55' }]}>
        <Animated.View
          style={[
            styles.glowOrb,
            {
              backgroundColor: C.violet,
              opacity: glowOpacity,
              transform: [{ scale: glowScale }],
            },
          ]}
        />

        <View style={styles.hubRow}>
          <View style={[styles.coreOuter, { borderColor: C.violet }]}>
            <LinearGradient colors={[C.violet, C.coral]} style={styles.coreInner}>
              <Icon name="network" size={28} color="#fff" />
            </LinearGradient>
          </View>

          <View style={styles.statsCol}>
            <Text style={[styles.hubTitle, { color: C.text }]}>Neural Core</Text>
            <Text style={[styles.hubSub, { color: C.textMid }]}>3D agent stream · live</Text>
            <View style={styles.statRow}>
              <View style={[styles.statPill, { backgroundColor: C.violet + '28' }]}>
                <Text style={[styles.statNum, { color: C.violet }]}>{thoughtCount}</Text>
                <Text style={[styles.statLbl, { color: C.textMid }]}>thoughts</Text>
              </View>
              <View style={[styles.statPill, { backgroundColor: C.mint + '28' }]}>
                <Text style={[styles.statNum, { color: C.mint }]}>{agentCount}</Text>
                <Text style={[styles.statLbl, { color: C.textMid }]}>agents</Text>
              </View>
            </View>
          </View>
        </View>

        <View style={styles.nodeRow}>
          {(['planner', 'executor', 'memory', 'research'] as const).map((a, i) => {
            const colors = [C.violet, C.coral, C.mint, C.orange];
            const c = colors[i];
            return (
              <View key={a} style={styles.nodeCol}>
                <View style={[styles.nodeDot, { backgroundColor: c, shadowColor: c }]} />
                <Text style={[styles.nodeLbl, { color: C.textLight }]}>{a.slice(0, 4)}</Text>
              </View>
            );
          })}
        </View>
      </LinearGradient>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { marginHorizontal: 16, marginBottom: 14, minHeight: 148 },
  layer3: {
    position: 'absolute',
    left: 14,
    right: -10,
    top: 14,
    bottom: -12,
    borderRadius: 22,
  },
  layer2: {
    position: 'absolute',
    left: 8,
    right: -5,
    top: 8,
    bottom: -6,
    borderRadius: 22,
  },
  layer1: {
    position: 'absolute',
    left: 3,
    right: 0,
    top: 4,
    bottom: -2,
    borderRadius: 22,
  },
  mainCard: {
    borderRadius: 22,
    padding: 16,
    borderWidth: 1.5,
    overflow: 'hidden',
    elevation: 14,
    shadowColor: '#5B4FE8',
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.35,
    shadowRadius: 20,
  },
  glowOrb: {
    position: 'absolute',
    width: 120,
    height: 120,
    borderRadius: 60,
    top: -40,
    right: -30,
  },
  hubRow: { flexDirection: 'row', alignItems: 'center', gap: 14, zIndex: 2 },
  coreOuter: {
    width: 72,
    height: 72,
    borderRadius: 36,
    borderWidth: 3,
    padding: 4,
    backgroundColor: 'rgba(255,255,255,0.12)',
    elevation: 8,
  },
  coreInner: {
    flex: 1,
    borderRadius: 32,
    alignItems: 'center',
    justifyContent: 'center',
  },
  statsCol: { flex: 1 },
  hubTitle: { fontSize: 20, fontWeight: '900', letterSpacing: -0.3 },
  hubSub: { fontSize: 12, marginTop: 2, marginBottom: 8 },
  statRow: { flexDirection: 'row', gap: 8 },
  statPill: { paddingHorizontal: 10, paddingVertical: 6, borderRadius: 12, alignItems: 'center' },
  statNum: { fontSize: 16, fontWeight: '900' },
  statLbl: { fontSize: 9, fontWeight: '700', textTransform: 'uppercase' },
  nodeRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginTop: 14,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.08)',
    zIndex: 2,
  },
  nodeCol: { alignItems: 'center', gap: 4 },
  nodeDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    elevation: 6,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.8,
    shadowRadius: 6,
  },
  nodeLbl: { fontSize: 9, fontWeight: '700', letterSpacing: 0.5 },
});
