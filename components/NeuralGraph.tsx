import type { ColorPalette } from '@/lib/themeContext';
import type { ThoughtEvent } from '@/types';
import { LinearGradient } from 'expo-linear-gradient';
import { useMemo } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import Svg, { Circle, Defs, Line, RadialGradient, Stop } from 'react-native-svg';

const AGENT_COLORS: Record<string, string> = {
  planner: '#9D8AFF',
  executor: '#FF8A7A',
  memory: '#4EECC8',
  research: '#FF9455',
  verifier: '#F5C842',
  security: '#5BA3FF',
  communication: '#E040FB',
  workflow: '#00BCD4',
};

const DEFAULT_NODES = [
  { id: 'planner', label: 'Planner', x: 0.5, y: 0.22 },
  { id: 'research', label: 'Research', x: 0.82, y: 0.42 },
  { id: 'executor', label: 'Executor', x: 0.68, y: 0.78 },
  { id: 'verifier', label: 'Verifier', x: 0.32, y: 0.78 },
  { id: 'memory', label: 'Memory', x: 0.18, y: 0.42 },
];

type GraphNode = { id: string; label: string; x: number; y: number; color: string; count: number };

export function NeuralGraph({
  thoughts,
  C,
  isDark,
}: {
  thoughts: ThoughtEvent[];
  C: ColorPalette;
  isDark: boolean;
}) {
  const W = 320;
  const H = 200;

  const { nodes, edges } = useMemo(() => {
    const agentCounts: Record<string, number> = {};
    thoughts.forEach((t) => {
      agentCounts[t.agent] = (agentCounts[t.agent] ?? 0) + 1;
    });

    const activeAgents = Object.keys(agentCounts);
    const baseNodes: GraphNode[] =
      activeAgents.length > 0
        ? activeAgents.slice(0, 6).map((agent, i) => {
            const angle = (i / Math.max(activeAgents.length, 1)) * Math.PI * 2 - Math.PI / 2;
            const r = activeAgents.length <= 3 ? 0.28 : 0.32;
            return {
              id: agent,
              label: agent.slice(0, 6),
              x: 0.5 + Math.cos(angle) * r,
              y: 0.5 + Math.sin(angle) * r,
              color: AGENT_COLORS[agent] ?? C.violet,
              count: agentCounts[agent] ?? 0,
            };
          })
        : DEFAULT_NODES.map((n) => ({
            ...n,
            color: AGENT_COLORS[n.id] ?? C.violet,
            count: 0,
          }));

    const edgeList: Array<{ from: GraphNode; to: GraphNode }> = [];
    if (thoughts.length > 1) {
      for (let i = 1; i < Math.min(thoughts.length, 8); i++) {
        const fromId = thoughts[i - 1].agent;
        const toId = thoughts[i].agent;
        const from = baseNodes.find((n) => n.id === fromId);
        const to = baseNodes.find((n) => n.id === toId);
        if (from && to && from.id !== to.id) edgeList.push({ from, to });
      }
    } else {
      for (let i = 0; i < baseNodes.length; i++) {
        const next = baseNodes[(i + 1) % baseNodes.length];
        edgeList.push({ from: baseNodes[i], to: next });
      }
    }

    return { nodes: baseNodes, edges: edgeList };
  }, [thoughts, C.violet]);

  return (
    <View style={styles.wrap}>
      <View style={[styles.layer3, { backgroundColor: C.coral + (isDark ? '44' : '28') }]} />
      <View style={[styles.layer2, { backgroundColor: C.mint + (isDark ? '40' : '24') }]} />
      <View style={[styles.layer1, { backgroundColor: C.violet + (isDark ? '50' : '30') }]} />

      <LinearGradient
        colors={isDark ? ['#2A2540', '#1A1628'] : ['#FFFFFF', '#F0EDFF']}
        style={[styles.card, { borderColor: C.violet + '44' }]}>
        <Text style={[styles.title, { color: C.text }]}>Neural Graph</Text>
        <Text style={[styles.sub, { color: C.textMid }]}>
          {thoughts.length > 0 ? `${thoughts.length} synapses · live` : 'Default agent mesh'}
        </Text>

        <Svg width={W} height={H} viewBox={`0 0 ${W} ${H}`}>
          <Defs>
            {nodes.map((n) => (
              <RadialGradient key={'g-' + n.id} id={'g-' + n.id} cx="50%" cy="50%" r="50%">
                <Stop offset="0%" stopColor={n.color} stopOpacity="1" />
                <Stop offset="100%" stopColor={n.color} stopOpacity="0.4" />
              </RadialGradient>
            ))}
          </Defs>

          {edges.map((e, i) => (
            <Line
              key={'e-' + i}
              x1={e.from.x * W}
              y1={e.from.y * H}
              x2={e.to.x * W}
              y2={e.to.y * H}
              stroke={e.to.color}
              strokeWidth={2}
              strokeOpacity={0.55}
              strokeDasharray={thoughts.length === 0 ? '4 4' : undefined}
            />
          ))}

          {nodes.map((n) => (
            <Circle
              key={'n-' + n.id}
              cx={n.x * W}
              cy={n.y * H}
              r={n.count > 0 ? 14 + Math.min(n.count, 5) : 12}
              fill={'url(#g-' + n.id + ')'}
              stroke="#fff"
              strokeWidth={2}
              strokeOpacity={0.85}
            />
          ))}
        </Svg>

        <View style={styles.legend}>
          {nodes.slice(0, 4).map((n) => (
            <View key={n.id} style={styles.legendItem}>
              <View style={[styles.legendDot, { backgroundColor: n.color }]} />
              <Text style={[styles.legendText, { color: C.textMid }]}>
                {n.label}{n.count > 0 ? ` (${n.count})` : ''}
              </Text>
            </View>
          ))}
        </View>
      </LinearGradient>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { marginHorizontal: 16, marginBottom: 12, minHeight: 260 },
  layer3: { position: 'absolute', left: 12, right: -8, top: 12, bottom: -10, borderRadius: 20 },
  layer2: { position: 'absolute', left: 6, right: -4, top: 6, bottom: -5, borderRadius: 20 },
  layer1: { position: 'absolute', left: 2, right: 0, top: 3, bottom: -2, borderRadius: 20 },
  card: {
    borderRadius: 20,
    padding: 14,
    borderWidth: 1.5,
    alignItems: 'center',
    elevation: 12,
    shadowColor: '#6B4EFF',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 16,
  },
  title: { fontSize: 15, fontWeight: '900', alignSelf: 'flex-start' },
  sub: { fontSize: 11, marginBottom: 8, alignSelf: 'flex-start' },
  legend: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginTop: 8, alignSelf: 'flex-start' },
  legendItem: { flexDirection: 'row', alignItems: 'center', gap: 5 },
  legendDot: { width: 8, height: 8, borderRadius: 4 },
  legendText: { fontSize: 10, fontWeight: '700' },
});
