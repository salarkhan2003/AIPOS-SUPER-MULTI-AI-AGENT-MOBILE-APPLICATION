import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { Pressable, ScrollView, StyleSheet, Text, View, ViewStyle } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ClayBackground } from './ClayBackground';
import { theme } from '@/constants/theme';

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
  const body = <View style={[styles.content, contentStyle]}>{children}</View>;

  return (
    <ClayBackground>
      <View style={[styles.header, { paddingTop: insets.top + 8 }]}>
        {showBack ? (
          <Pressable onPress={() => router.back()} style={styles.backBtn} hitSlop={12}>
            <Ionicons name="chevron-back" size={24} color={theme.colors.text.primary} />
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
      {scroll ? (
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={[styles.scroll, { paddingBottom: insets.bottom + 100 }]}>
          {body}
        </ScrollView>
      ) : (
        <View style={[styles.scroll, { paddingBottom: insets.bottom + 24, flex: 1 }]}>{body}</View>
      )}
    </ClayBackground>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: theme.spacing.md,
    paddingBottom: theme.spacing.sm,
  },
  backBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(255,255,255,0.08)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  backPlaceholder: { width: 44 },
  headerText: { flex: 1, marginHorizontal: theme.spacing.sm },
  title: { ...theme.typography.h1, color: theme.colors.text.primary },
  subtitle: { ...theme.typography.caption, color: theme.colors.text.secondary, marginTop: 2 },
  right: { minWidth: 44, alignItems: 'flex-end' },
  scroll: { paddingHorizontal: theme.spacing.md },
  content: { gap: theme.spacing.md },
});
