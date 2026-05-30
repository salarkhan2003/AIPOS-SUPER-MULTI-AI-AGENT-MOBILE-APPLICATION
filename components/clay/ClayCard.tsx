import { L } from '@/constants/light';
import * as Haptics from 'expo-haptics';
import { Pressable, StyleSheet, View, ViewStyle } from 'react-native';

interface Props {
  children: React.ReactNode;
  onPress?: () => void;
  style?: ViewStyle;
  padding?: number;
  inset?: boolean;
}

export function ClayCard({ children, onPress, style, padding = 16, inset = false }: Props) {
  const inner = (
    <View style={[styles.wrap, inset && styles.inset, style]}>
      <View style={{ padding }}>{children}</View>
    </View>
  );

  if (!onPress) return inner;

  return (
    <Pressable
      onPress={() => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        onPress();
      }}
      style={({ pressed }) => [{ transform: [{ scale: pressed ? 0.97 : 1 }] }]}>
      {inner}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  wrap: {
    backgroundColor: L.surface,
    borderRadius: L.radius.lg,
    marginBottom: 12,
    shadowColor: L.shadow,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 1,
    shadowRadius: 12,
    elevation: 4,
  },
  inset: {
    backgroundColor: L.bg,
    shadowOpacity: 0,
    elevation: 0,
    borderWidth: 1,
    borderColor: L.border,
  },
});
