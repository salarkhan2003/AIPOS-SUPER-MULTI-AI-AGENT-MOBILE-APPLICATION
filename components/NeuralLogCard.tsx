import { Icon } from '@/components/Icon';
import type { ColorPalette } from '@/lib/themeContext';
import type { ThoughtEvent } from '@/types';
import { LinearGradient } from 'expo-linear-gradient';
import { useEffect, useRef } from 'react';
import { Animated, Platform, StyleSheet, Text, View } from 'react-native';

type AgentMeta = {
  color: string;
  bg: string;
  icon: 'brain' | 'zap' | 'memory' | 'search' | 'check' | 'shield' | 'mail' | 'git-branch';
  label: string;
};

export function NeuralLogCard({
  item,
  index,
  meta,
  message,
  C,
  isDark,
}: {
  item: ThoughtEvent;
  index: number;
  meta: AgentMeta;
  message: string;
  C: ColorPalette;
  isDark: boolean;
}) {
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const liftAnim = useRef(new Animated.Value(14)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 320,
        useNativeDriver: true,
        delay: Math.min(index * 40, 300),
      }),
      Animated.spring(liftAnim, {
        toValue: 0,
        friction: 6,
        tension: 45,
        useNativeDriver: true,
        delay: Math.min(index * 40, 300),
      }),
    ]).start();
  }, [fadeAnim, index, liftAnim]);

  const actionName = item.action?.action?.replace(/_/g, ' ') ?? '';
  const timeStr = new Date(item.timestamp).toLocaleTimeString('en-IN', {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  });

  const gradColors = isDark
    ? ([meta.color + '22', C.surfaceAlt, C.surface] as const)
    : (['#FFFFFF', '#FAFAFF', C.surfaceAlt] as const);

  return (
    <Animated.View
      style={[
        styles.cardWrap,
        {
          opacity: fadeAnim,
          transform: [{ translateY: liftAnim }],
        },
      ]}>
      {/* 3D stack — solid layers visible on Android */}
      <View style={[styles.shadowLayer, { backgroundColor: meta.color + (isDark ? 'AA' : '66') }]} />
      <View style={[styles.shadowLayerMid, { backgroundColor: meta.color + (isDark ? '55' : '33') }]} />

      <LinearGradient colors={[...gradColors]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.cardOuter}>
        <View style={[styles.leftBeam, { backgroundColor: meta.color }]} />
        <View style={[styles.topShine, { backgroundColor: isDark ? 'rgba(255,255,255,0.12)' : 'rgba(255,255,255,0.9)' }]} />

        <View style={styles.cardInner}>
          <View style={styles.cardTopRow}>
            <LinearGradient colors={[meta.bg, meta.color]} style={styles.agentBubble}>
              <Icon name={meta.icon} size={16} color="#fff" />
            </LinearGradient>
            <Text style={[styles.agentName, { color: meta.color }]} numberOfLines={1}>
              {meta.label.toUpperCase()}
            </Text>
            {item.action ? (
              <View style={[styles.actionBadge, { backgroundColor: meta.color + '35' }]}>
                <Text style={[styles.actionBadgeText, { color: meta.color }]}>ACTION</Text>
              </View>
            ) : null}
            <Text style={[styles.agentTime, { color: C.textLight }]}>{timeStr}</Text>
          </View>

          <Text style={[styles.msg, { color: C.text }]}>{message}</Text>

          {actionName ? (
            <View style={[styles.actionRow, { borderColor: meta.color + '60', backgroundColor: meta.color + '18' }]}>
              <View style={[styles.actionDot, { backgroundColor: meta.color }]} />
              <Text style={[styles.actionLabel, { color: meta.color }]} numberOfLines={2}>
                {actionName}
              </Text>
            </View>
          ) : null}

          {item.action?.reasoning && item.action.reasoning.length > 0 ? (
            <Text style={[styles.reasoning, { color: C.textMid }]} numberOfLines={3}>
              {item.action.reasoning.filter(Boolean).join(' · ')}
            </Text>
          ) : null}
        </View>
      </LinearGradient>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  cardWrap: {
    marginBottom: 18,
    marginHorizontal: 2,
    minHeight: 80,
  },
  shadowLayer: {
    position: 'absolute',
    left: 12,
    right: -8,
    top: 12,
    bottom: -10,
    borderRadius: 20,
    ...Platform.select({
      android: { elevation: 2 },
      ios: { shadowColor: '#000', shadowOffset: { width: 4, height: 8 }, shadowOpacity: 0.25, shadowRadius: 8 },
    }),
  },
  shadowLayerMid: {
    position: 'absolute',
    left: 6,
    right: -4,
    top: 6,
    bottom: -5,
    borderRadius: 20,
  },
  cardOuter: {
    borderRadius: 20,
    marginLeft: 2,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.12)',
    ...Platform.select({
      android: { elevation: 10 },
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 10 },
        shadowOpacity: 0.3,
        shadowRadius: 14,
      },
    }),
  },
  leftBeam: {
    position: 'absolute',
    left: 0,
    top: 0,
    bottom: 0,
    width: 6,
    zIndex: 3,
  },
  topShine: {
    position: 'absolute',
    top: 0,
    left: 6,
    right: 0,
    height: 4,
    zIndex: 3,
  },
  cardInner: {
    padding: 14,
    paddingLeft: 16,
  },
  cardTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 8,
    flexWrap: 'wrap',
  },
  agentBubble: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 4,
  },
  agentName: { fontSize: 10, fontWeight: '800', letterSpacing: 0.6, maxWidth: 80 },
  actionBadge: { paddingHorizontal: 7, paddingVertical: 3, borderRadius: 6 },
  actionBadgeText: { fontSize: 8, fontWeight: '800' },
  agentTime: { fontSize: 10, marginLeft: 'auto' },
  msg: { fontSize: 14, lineHeight: 21, marginBottom: 6, fontWeight: '500' },
  actionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 7,
    borderWidth: 1.5,
    borderRadius: 10,
    paddingHorizontal: 10,
    paddingVertical: 7,
    marginBottom: 5,
  },
  actionDot: { width: 6, height: 6, borderRadius: 3 },
  actionLabel: { fontSize: 12, fontWeight: '700', textTransform: 'capitalize', flex: 1 },
  reasoning: { fontSize: 11, lineHeight: 16, fontStyle: 'italic' },
});
