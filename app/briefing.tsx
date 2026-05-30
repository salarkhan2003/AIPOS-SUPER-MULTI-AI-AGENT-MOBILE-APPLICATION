import { Text } from 'react-native';
import { BasicScreen, Card } from '@/components/Screen';
import { B } from '@/constants/basic';

export default function BriefingScreen() {
  return (
    <BasicScreen title="Daily Briefing">
      <Card><Text style={{ color: B.text }}>Generated from Planner + Memory on schedule (wire cron).</Text></Card>
    </BasicScreen>
  );
}
