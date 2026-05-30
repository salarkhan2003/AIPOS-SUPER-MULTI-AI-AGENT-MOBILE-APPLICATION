import { Icon } from '@/components/Icon';
import { L } from '@/constants/light';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

interface Props {
  title: string;
  subtitle?: string;
  showBack?: boolean;
  onBack?: () => void;
}

export function ClayHalo({ title, subtitle, showBack, onBack }: Props) {
  const insets = useSafeAreaInsets();
  return (
    <View style={[styles.wrap, { paddingTop: insets.top + 12 }]}>
      {showBack && onBack ? (
        <Pressable onPress={onBack} style={styles.backBtn} hitSlop={12}>
          <Icon name="back" size={20} color={L.dark} />
          <Text style={styles.backLabel}>Back</Text>
        </Pressable>
      ) : null}
      <Text style={styles.title}>{title}</Text>
      {subtitle ? <Text style={styles.sub}>{subtitle}</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { paddingHorizontal: 16, paddingBottom: 16 },
  backBtn: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 12 },
  backLabel: { color: L.textMid, fontSize: 15, fontWeight: '600' },
  title: { fontSize: 28, fontWeight: '800', color: L.dark, letterSpacing: -0.5 },
  sub: { color: L.textMid, fontSize: 14, marginTop: 4 },
});
