import { Text } from 'react-native';
import { BasicScreen, Card } from '@/components/Screen';
import { B } from '@/constants/basic';

export default function NotesScreen() {
  return (
    <BasicScreen title="Notes">
      <Card><Text style={{ color: B.text }}>Notes sync to memory.add on save.</Text></Card>
    </BasicScreen>
  );
}
