import { Text } from 'react-native';
import { BasicScreen, Card } from '@/components/Screen';
import { B } from '@/constants/basic';

export default function IntegrationsScreen() {
  return (
    <BasicScreen title="Integrations">
      <Card><Text style={{ color: B.text }}>Gmail · Calendar · Browser · Custom API</Text></Card>
    </BasicScreen>
  );
}
