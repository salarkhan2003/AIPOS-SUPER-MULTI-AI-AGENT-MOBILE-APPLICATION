import { L } from '@/constants/light';
import { useState } from 'react';
import { StyleSheet, Text, TextInput, TextInputProps, View } from 'react-native';

interface Props extends TextInputProps {
  label?: string;
}

export function ClayInput({ label, style, ...props }: Props) {
  const [focused, setFocused] = useState(false);
  return (
    <View style={styles.wrap}>
      {label ? <Text style={styles.label}>{label}</Text> : null}
      <View style={[styles.input, focused && styles.focused]}>
        <TextInput
          {...props}
          placeholderTextColor={L.textLight}
          style={[styles.text, style]}
          onFocus={(e) => { setFocused(true); props.onFocus?.(e); }}
          onBlur={(e) => { setFocused(false); props.onBlur?.(e); }}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { marginBottom: 12 },
  label: { color: L.textMid, fontSize: 12, fontWeight: '700', marginBottom: 6, letterSpacing: 0.5 },
  input: {
    backgroundColor: L.surface,
    borderRadius: L.radius.md,
    borderWidth: 1.5,
    borderColor: L.border,
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
  focused: { borderColor: L.violet },
  text: { color: L.text, fontSize: 16 },
});
