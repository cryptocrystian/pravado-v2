import { View, Text, StyleSheet } from 'react-native';
import { colors } from '../constants/colors';

const GATE_CONFIG: Record<string, { icon: string; bg: string; color: string }> = {
  passed: { icon: '✓', bg: colors.passed + '18', color: colors.passed },
  warning: { icon: '⚠', bg: colors.warning + '18', color: colors.warning },
  blocked: { icon: '✗', bg: colors.blocked + '18', color: colors.blocked },
};

export function CiteMindBadge({ score, gate }: { score?: number; gate: string }) {
  const cfg = GATE_CONFIG[gate] || GATE_CONFIG.warning;
  return (
    <View style={[s.badge, { backgroundColor: cfg.bg }]}>
      <Text style={[s.text, { color: cfg.color }]}>{cfg.icon} {score ?? '--'}</Text>
    </View>
  );
}

const s = StyleSheet.create({
  badge: { paddingHorizontal: 8, paddingVertical: 4, borderRadius: 8 },
  text: { fontSize: 12, fontWeight: '700' },
});
