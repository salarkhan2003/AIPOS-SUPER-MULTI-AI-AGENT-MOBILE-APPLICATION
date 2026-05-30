import { L } from '@/constants/light';
import { StyleSheet, View, ViewStyle } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

interface Props {
  children: React.ReactNode;
  style?: ViewStyle;
  padded?: boolean;
}

export function ClayScreen({ children, style, padded = true }: Props) {
  const insets = useSafeAreaInsets();
  return (
    <View style={[styles.root, style]}>
      <View style={[styles.content, padded && { paddingTop: insets.top + 8 }]}>
        {children}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: L.bg },
  content: { flex: 1 },
});
