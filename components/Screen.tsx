import { ClayCard, ClayShell } from '@/components/clay';
import { L } from '@/constants/light';
import { router } from 'expo-router';
import { Text, ViewStyle } from 'react-native';

export function BasicScreen({ title, children }: { title: string; children?: React.ReactNode }) {
  return (
    <ClayShell title={title} showBack onBack={() => router.back()}>
      {children}
    </ClayShell>
  );
}

export function Card({ children, style }: { children: React.ReactNode; style?: ViewStyle }) {
  return <ClayCard style={style}>{children}</ClayCard>;
}

export function CardText({ children }: { children: React.ReactNode }) {
  return <Text style={{ color: L.text }}>{children}</Text>;
}
