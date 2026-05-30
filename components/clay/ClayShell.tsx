import { ScrollView, StyleSheet, View, ViewStyle } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ClayHalo } from './ClayHalo';
import { ClayScreen } from './ClayScreen';

interface Props {
  title: string;
  subtitle?: string;
  children: React.ReactNode;
  showBack?: boolean;
  onBack?: () => void;
  scroll?: boolean;
  contentStyle?: ViewStyle;
}

export function ClayShell({
  title,
  subtitle,
  children,
  showBack = true,
  onBack,
  scroll = true,
  contentStyle,
}: Props) {
  const insets = useSafeAreaInsets();
  const body = (
    <>
      <ClayHalo title={title} subtitle={subtitle} showBack={showBack} onBack={onBack} />
      {children}
    </>
  );

  return (
    <ClayScreen padded={false}>
      {scroll ? (
        <ScrollView
          contentContainerStyle={[styles.scroll, { paddingBottom: insets.bottom + 100 }, contentStyle]}
          showsVerticalScrollIndicator={false}>
          {body}
        </ScrollView>
      ) : (
        <View style={{ flex: 1 }}>{body}</View>
      )}
    </ClayScreen>
  );
}

const styles = StyleSheet.create({
  scroll: { paddingHorizontal: 16 },
});
