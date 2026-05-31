import { Icon } from '@/components/Icon';
import type { ColorPalette } from '@/lib/themeContext';
import {
    Canvas,
    Circle,
    Group,
    Line,
    RadialGradient,
    vec,
} from '@shopify/react-native-skia';
import { LinearGradient } from 'expo-linear-gradient';
import { useEffect, useRef } from 'react';
import { Animated, StyleSheet, Text, View } from 'react-native';

const CANVAS_W = 260;
const CANVAS_H = 110;

const NODES = [
  { x: 30,  y: 55,  color: '#9D8AFF', label: 'plan' },
  { x: 78,  y: 22,  color: '#5CE1E6', label: 'res'  },
  { x: 78,  y: 88,  color: '#FFC857', label: 'mem'  },
  { x: 135, y: 40,  color: '#6EE7A0', label: 'exec' },
  { x: 135, y: 80,  color: '#FF8A7A', label: 'ver'  },
  { x: 192, y: 22,  color: '#FF7EB6', label: 'sec'  },
  { x: 192, y: 72,  color: '#B8A8FF', label: 'com'  },
  { x: 240, y: 50,  color: '#7AE582', label: 'wfl'  },
] as const;

const EDGES: [number, number][] = [
  [0, 1], [0, 2], [0, 3],
  [1, 3], [2, 3], [3, 4],
  [3, 5], [4, 6], [5, 7],
  [6, 7], [1, 6], [2, 4],
];

function NeuralGraph() {
  return (
    <Canvas style={{ width: CANVAS_W, height: CANVAS_H }}>
      {EDGES.map(([a, b], i) => (
        <Line
          key={'e' + i}
          p1={vec(NODES[a].x, NODES[a].y)}
          p2={vec(NODES[b].x, NODES[b].y)}
          strokeWidth={1.2}
          color="rgba(157,138,255,0.22)"
        />
      ))}
      {NODES.map((n, i) => (
        <Group key={'n' + i}>
          <Circle cx={n.x} cy={n.y} r={10}>
            <RadialGradient
              c={vec(n.x, n.y)}
              r={10}
              colors={[n.color + '99', 'transparent']}
            />
          </Circle>
          <Circle cx={n.x} cy={n.y} r={4} color={n.color} />
        </Group>
      ))}
    </Canvas>
  );
}

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
        Animated.timing(pulse, { toValue: 1, duration: 2400, useNativeDriver: true }),
        Animated.timing(pulse, { toValue: 0, duration: 2400, useNativeDriver: true }),
      ]),
    );
    loop.start();
    return () => loop.stop();
  }, [pulse]);

  const glowOpacity = pulse.interpolate({ inputRange: [0, 1], outputRange: [0.28, 0.72] });
  const glowScale   = pulse.interpolate({ inputRange: [0, 1], outputRange: [1, 1.14] });

  const cardColors: [string, string, string] = isDark
    ? ['#2A2540', '#1A1628', '#12101A']
    : ['#FFFFFF', '#F5F2FF', '#EDE8FF'];

  return (
    <View style={styles.wrap}>
      <View style={[styles.layer3, { backgroundColor: C.coral + (isDark ? '44' : '28') }]} />
      <View style={[styles.layer2, { backgroundColor: C.mint  + (isDark ? '44' : '28') }]} />
      <View style={[styles.layer1, { backgroundColor: C.violet + (isDark ? '55' : '38') }]} />

      <LinearGradient
        colors={cardColors}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={[styles.mainCard, { borderColor: C.violet + '55' }]}>

        <Animated.View
          style={[
            styles.glowOrb,
            { backgroundColor: C.violet, opacity: glowOpacity, transform: [{ scale: glowScale }] },
          ]}
        />

        <View style={styles.headerRow}>
          <View style={[styles.coreOuter, { borderColor: C.violet }]}>
            <LinearGradient colors={[C.violet, C.coral]} style={styles.coreInner}>
              <Icon name="network" size={22} color="#fff" />
            </LinearGradient>
          </View>
          <View style={styles.statsCol}>
            <Text style={[styles.hubTitle, { color: C.text }]}>Neural Core</Text>
            <Text style={[styles.hubSub, { color: C.textMid }]}>8-agent live graph</Text>
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

        <View style={[styles.graphWrap, { borderTopColor: 'rgba(255,255,255,0.08)' }]}>
          <NeuralGraph />
        </View>
      </LinearGradient>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { marginHorizontal: 16, marginBottom: 14 },
  layer3: { position: 'absolute', left: 14, right: -10, top: 14, bottom: -12, borderRadius: 22 },
  layer2: { position: 'absolute', left: 8,  right: -5,  top: 8,  bottom: -6,  borderRadius: 22 },
  layer1: { position: 'absolute', left: 3,  right: 0,   top: 4,  bottom: -2,  borderRadius: 22 },
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
    width: 130,
    height: 130,
    borderRadius: 65,
    top: -50,
    right: -40,
  },
  headerRow: { flexDirection: 'row', alignItems: 'center', gap: 14, zIndex: 2 },
  coreOuter: {
    width: 58,
    height: 58,
    borderRadius: 29,
    borderWidth: 2.5,
    padding: 3,
    backgroundColor: 'rgba(255,255,255,0.1)',
    elevation: 6,
  },
  coreInner: { flex: 1, borderRadius: 26, alignItems: 'center', justifyContent: 'center' },
  statsCol: { flex: 1 },
  hubTitle: { fontSize: 18, fontWeight: '900', letterSpacing: -0.3 },
  hubSub: { fontSize: 11, marginTop: 2, marginBottom: 8 },
  statRow: { flexDirection: 'row', gap: 8 },
  statPill: { paddingHorizontal: 10, paddingVertical: 5, borderRadius: 10, alignItems: 'center' },
  statNum: { fontSize: 15, fontWeight: '900' },
  statLbl: { fontSize: 9, fontWeight: '700', textTransform: 'uppercase' },
  graphWrap: {
    marginTop: 10,
    borderTopWidth: 1,
    paddingTop: 8,
    alignItems: 'center',
    zIndex: 2,
  },
});
