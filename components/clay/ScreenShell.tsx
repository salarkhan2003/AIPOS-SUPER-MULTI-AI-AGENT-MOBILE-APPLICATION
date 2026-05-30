import { Icon } from '@/components/Icon';
import { L } from '@/constants/light';
import { router } from 'expo-router';
import { Pressable, ScrollView, StyleSheet, Text, View, ViewStyle } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

interface Props {
  title: string;
  subtitle?: string;
  children: React.ReactNode;
  scroll?: boolean;
  showBack?: boolean;
  rightAction?: React.ReactNode;
  contentStyle?: ViewStyle;
}

export function ScreenShell({
  title,
  subtitle,
  children,
  scroll = true,
  showBack = true,
  rightAction,
  contentStyle,
}: Props) {
  const insets = useSafeAreaInsets();

  const header = (
    <View style={[styles.header, { paddingTop: insets.top + 8 }]}>
      {showBack ? (
        <Pressable onPress={() => router.back()} style={styles.backBtn} hitSlop={12}>
          <Icon name="back" size={20} color={L.dark} />
        </Pressable>
      ) : (
        <View style={styles.backPlaceholder} />
      )}
      <View style={styles.headerText}>
        <Text style={styles.title}>{title}</Text>
        {subtitle ? <Text style={styles.subtitle}>{subtitle}</Text> : null}
      </View>
      <View style={styles.right}>{rightAction}</View>
    </View>
  );

  const body = <View style={[styles.content, contentStyle]}>{children}</View>;

  return (
    <View style={styles.root}>
      {header}
      {scroll ? (
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={[styles.scroll, { paddingBottom: insets.bottom + 100 }]}>
          {body}
        </ScrollView>
      ) : (
        <View style={[styles.scroll, { paddingBottom: insets.bottom + 24, flex: 1 }]}>{body}</View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: L.bg },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingBottom: 8,
  },
  backBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: L.surface,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 6,
    elevation: 2,
  },
  backPlaceholder: { width: 40 },
  headerText: { flex: 1, marginHorizontal: 12 },
  title: { fontSize: 22, fontWeight: '800', color: L.dark, letterSpacing: -0.5 },
  subtitle: { fontSize: 13, color: L.textMid, marginTop: 2 },
  right: { minWidth: 40, alignItems: 'flex-end' },
  scroll: { paddingHorizontal: 16 },
  content: { gap: 12 },
});
