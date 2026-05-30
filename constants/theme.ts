/** AIPOS — Claymorphism design system (dark violet command center) */

export const theme = {
  colors: {
    bg: '#12081F',
    bgElevated: '#1A0F2E',
    bgDeep: '#0D0616',
    violet: '#2D1B4E',
    violetGlow: '#6B4EFF',
    violetSoft: '#9D8AFF',

    clay: {
      lavender: '#E8E0FF',
      mint: '#D4F5E9',
      peach: '#FFE8DC',
      sky: '#D6EEFF',
      rose: '#FFD6E8',
      cream: '#F5F0FF',
      lilac: '#EDE4FF',
    },

    text: {
      primary: '#F8F4FF',
      secondary: '#B8A8D4',
      muted: '#7A6B96',
      onClay: '#2A1F45',
      onClayMuted: '#5C4D78',
    },

    accent: {
      cyan: '#5CE1E6',
      green: '#6EE7A0',
      amber: '#FFC857',
      coral: '#FF8A7A',
      pink: '#FF7EB6',
    },

    status: {
      success: '#6EE7A0',
      warning: '#FFC857',
      error: '#FF7A7A',
      info: '#5CE1E6',
      running: '#9D8AFF',
    },

    risk: {
      low: '#6EE7A0',
      medium: '#FFC857',
      high: '#FF8A7A',
      critical: '#FF4D6A',
    },
  },

  spacing: {
    xs: 4,
    sm: 8,
    md: 16,
    lg: 24,
    xl: 32,
    xxl: 48,
  },

  radius: {
    sm: 16,
    md: 24,
    lg: 32,
    xl: 40,
    squircle: 28,
    pill: 999,
  },

  typography: {
    hero: { fontSize: 32, fontWeight: '700' as const, letterSpacing: -0.5 },
    h1: { fontSize: 26, fontWeight: '700' as const },
    h2: { fontSize: 20, fontWeight: '600' as const },
    h3: { fontSize: 17, fontWeight: '600' as const },
    body: { fontSize: 15, fontWeight: '400' as const, lineHeight: 22 },
    caption: { fontSize: 12, fontWeight: '500' as const },
    micro: { fontSize: 10, fontWeight: '600' as const, letterSpacing: 0.8 },
  },

  shadows: {
    clayOuter: {
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 12 },
      shadowOpacity: 0.35,
      shadowRadius: 24,
      elevation: 12,
    },
    clayInner: {
      shadowColor: '#FFF',
      shadowOffset: { width: -2, height: -2 },
      shadowOpacity: 0.15,
      shadowRadius: 8,
    },
    glow: {
      shadowColor: '#6B4EFF',
      shadowOffset: { width: 0, height: 0 },
      shadowOpacity: 0.4,
      shadowRadius: 20,
      elevation: 8,
    },
  },
} as const;

export type ClayVariant = 'lavender' | 'mint' | 'peach' | 'sky' | 'rose' | 'cream' | 'lilac';

export const clayGradients: Record<ClayVariant, [string, string, string]> = {
  lavender: ['#F0EBFF', '#E0D4FF', '#D4C4FF'],
  mint: ['#E8FFF5', '#D0F5E4', '#B8EBD4'],
  peach: ['#FFF5EE', '#FFE4D4', '#FFD4C4'],
  sky: ['#EEF8FF', '#D6EEFF', '#C4E4FF'],
  rose: ['#FFF0F5', '#FFD6E8', '#FFC4DC'],
  cream: ['#FAF7FF', '#F0EBFF', '#E8E0FF'],
  lilac: ['#F5F0FF', '#EDE4FF', '#E0D4FF'],
};

export const agentColors: Record<string, string> = {
  planner: '#9D8AFF',
  executor: '#5CE1E6',
  research: '#6EE7A0',
  memory: '#FFC857',
  verifier: '#FF8A7A',
  security: '#FF7EB6',
  communication: '#B8A8FF',
  workflow: '#7AE582',
};
