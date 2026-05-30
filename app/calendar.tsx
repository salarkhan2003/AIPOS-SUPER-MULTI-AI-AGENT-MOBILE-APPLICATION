import { Text } from 'react-native';
import { BasicScreen, Card } from '@/components/Screen';
import { B } from '@/constants/basic';

export default function CalendarScreen() {
  return (
    <BasicScreen title="Calendar">
      <Card><Text style={{ color: B.text }}>Calendar API + create_watchdog reminders.</Text></Card>
    </BasicScreen>
  );
}
