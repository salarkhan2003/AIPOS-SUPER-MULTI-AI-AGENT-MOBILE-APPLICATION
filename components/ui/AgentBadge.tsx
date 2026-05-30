import { StyleSheet, Text, View } from 'react-native';
import { agentColors, theme } from '@/constants/theme';
import type { AgentRole, AgentStatus } from '@/types';

const roleLabels: Record<AgentRole, string> = {
  planner: 'Planner',
  executor: 'Executor',
  research: 'Research',
  memory: 'Memory',
  verifier: 'Verifier',
  security: 'Security',
  communication: 'Comms',
  workflow: 'Workflow',
};

const statusColors: Record<AgentStatus, string> = {
  idle: theme.colors.text.muted,
  thinking: theme.colors.accent.amber,
  working: theme.colors.status.running,
  waiting: theme.colors.accent.cyan,
  error: theme.colors.status.error,
};

interface Props {
  role: AgentRole;
  status?: AgentStatus;
  compact?: boolean;
}

export function AgentBadge({ role, status = 'idle', compact }: Props) {
  return (
    <View style={[styles.badge, compact && styles.compact]}>
      <View style={[styles.dot, { backgroundColor: statusColors[status] }]} />
      <Text style={[styles.text, compact && styles.textCompact]}>{roleLabels[role]}</Text>
      <View style={[styles.chip, { backgroundColor: agentColors[role] + '33' }]}>
        <View style={[styles.chipInner, { backgroundColor: agentColors[role] }]} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: theme.radius.pill,
    backgroundColor: 'rgba(255,255,255,0.06)',
  },
  compact: { paddingHorizontal: 8, paddingVertical: 4 },
  dot: { width: 6, height: 6, borderRadius: 3 },
  text: { color: theme.colors.text.primary, fontSize: 12, fontWeight: '600' },
  textCompact: { fontSize: 10 },
  chip: { width: 14, height: 14, borderRadius: 7, alignItems: 'center', justifyContent: 'center' },
  chipInner: { width: 8, height: 8, borderRadius: 4 },
});
