import { Text } from 'react-native';
import { BasicScreen, Card } from '@/components/Screen';
import { B } from '@/constants/basic';

export default function SettingsScreen() {
  return (
    <BasicScreen title="Settings">
      <Card><Text style={{ color: B.text }}>Locale: India · IST · Encrypted memory on</Text></Card>
    </BasicScreen>
  );
}
