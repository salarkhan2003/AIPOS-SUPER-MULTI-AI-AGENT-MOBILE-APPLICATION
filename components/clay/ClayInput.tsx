import { useColors } from '@/lib/themeContext';
import { useMemo, useState } from 'react';
import { StyleSheet, Text, TextInput, TextInputProps, View } from 'react-native';

interface Props extends TextInputProps {
  label?: string;
}

export function ClayInput({ label, style, ...props }: Props) {
  const C = useColors();
  const styles = useMemo(() => makeStyles(C), [C]);
  const [focused, setFocused] = useState(false);

  return (
    <View style={styles.wrap}>
      {label ? <Text style={styles.label}>{label}</Text> : null}
      <View style={[styles.input, focused && styles.focused]}>
        <TextInput
          {...props}
          placeholderTextColor={C.textLight}
          style={[styles.text, style]}
          onFocus={(e) => {
            setFocused(true);
            props.onFocus?.(e);
          }}
          onBlur={(e) => {
            setFocused(false);
            props.onBlur?.(e);
          }}
        />
      </View>
    </View>
  );
}

function makeStyles(C: ReturnType<typeof useColors>) {
  return StyleSheet.create({
    wrap: { marginBottom: 12 },
    label: { color: C.textMid, fontSize: 12, fontWeight: '700', marginBottom: 6, letterSpacing: 0.5 },
    input: {
      backgroundColor: C.surface,
      borderRadius: C.radius.md,
      borderWidth: 1.5,
      borderColor: C.border,
      paddingHorizontal: 14,
      paddingVertical: 12,
    },
    focused: { borderColor: C.violet },
    text: { color: C.text, fontSize: 16 },
  });
}
