import { StyleSheet, Text, View } from 'react-native';
import { theme } from '@/constants/theme';

interface Props {
  progress: number;
  label?: string;
  riskScore?: number;
}

export function ProgressClay({ progress, label, riskScore }: Props) {
  const riskColor =
    riskScore === undefined
      ? theme.colors.violetGlow
      : riskScore < 30
        ? theme.colors.risk.low
        : riskScore < 60
          ? theme.colors.risk.medium
          : theme.colors.risk.high;

  return (
    <View style={styles.wrap}>
      {(label || riskScore !== undefined) && (
        <View style={styles.row}>
          {label ? <Text style={styles.label}>{label}</Text> : <View />}
          {riskScore !== undefined && (
            <Text style={[styles.risk, { color: riskColor }]}>Risk {riskScore}</Text>
          )}
        </View>
      )}
      <View style={styles.track}>
        <View style={[styles.fill, { width: `${Math.min(100, progress)}%`, backgroundColor: riskColor }]} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { gap: 6 },
  row: { flexDirection: 'row', justifyContent: 'space-between' },
  label: { ...theme.typography.caption, color: theme.colors.text.onClayMuted },
  risk: { ...theme.typography.micro, textTransform: 'uppercase' },
  track: {
    height: 8,
    borderRadius: 4,
    backgroundColor: 'rgba(42,31,69,0.15)',
    overflow: 'hidden',
  },
  fill: { height: '100%', borderRadius: 4 },
});
