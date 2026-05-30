import { Text } from 'react-native';
import { BasicScreen, Card } from '@/components/Screen';
import { B } from '@/constants/basic';

export default function EmailScreen() {
  return (
    <BasicScreen title="Email Assistant">
      <Card><Text style={{ color: B.text }}>Communication agent drafts via Groq (connect Gmail API).</Text></Card>
    </BasicScreen>
  );
}
