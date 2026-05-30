import { useColors, useTheme } from '@/lib/themeContext';
import * as Haptics from 'expo-haptics';
import { useMemo } from 'react';
import { Pressable, StyleSheet, Text, ViewStyle } from 'react-native';

interface Props {
  label: string;
  onPress?: () => void;
  variant?: 'primary' | 'secondary' | 'ghost';
  style?: ViewStyle;
  loading?: boolean;
  disabled?: boolean;
}

export function ClayButton({ label, onPress, variant = 'primary', style, loading, disabled }: Props) {
  const C = useColors();
  const { isDark } = useTheme();
  const styles = useMemo(() => makeStyles(C), [C]);
  const isPrimary = variant === 'primary';

  if (variant === 'ghost') {
    return (
      <Pressable onPress={onPress} disabled={disabled || loading} style={[styles.ghost, style]}>
        <Text style={styles.ghostText}>{loading ? 'Please wait…' : label}</Text>
      </Pressable>
    );
  }

  const bg = isPrimary ? (isDark ? C.violet : C.ink) : C.violet;
  const labelColor = '#fff';

  return (
    <Pressable
      disabled={disabled || loading}
      onPress={() => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        onPress?.();
      }}
      style={({ pressed }) => [
        styles.btn,
        { backgroundColor: bg, opacity: disabled ? 0.5 : pressed ? 0.85 : 1 },
        style,
      ]}>
      <Text style={[styles.label, { color: labelColor }]}>{loading ? 'Please wait…' : label}</Text>
    </Pressable>
  );
}

function makeStyles(C: ReturnType<typeof useColors>) {
  return StyleSheet.create({
    btn: {
      minHeight: 52,
      borderRadius: C.radius.md,
      justifyContent: 'center',
      alignItems: 'center',
      paddingHorizontal: 24,
      paddingVertical: 14,
      marginBottom: 12,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.12,
      shadowRadius: 10,
      elevation: 4,
    },
    label: { fontSize: 16, fontWeight: '700', color: '#fff' },
    ghost: { paddingVertical: 14, alignItems: 'center', marginBottom: 8 },
    ghostText: { color: C.violet, fontSize: 15, fontWeight: '600' },
  });
}
