import { View, Text, StyleSheet } from 'react-native';
import { colors } from '../constants/colors';

const STATUS_CONFIG: Record<string, { label: string; color: string }> = {
  at_risk: { label: 'At Risk', color: colors.red },
  emerging: { label: 'Building', color: colors.yellow },
  competitive: { label: 'Strong', color: colors.green },
  dominant: { label: 'Dominant', color: colors.green },
};

interface Props { score: number; delta: number; status: string; sparkline?: number[]; }

export function EVIScore({ score, delta, status }: Props) {
  const cfg = STATUS_CONFIG[status] || STATUS_CONFIG.emerging;
  return (
    <View style={s.container}>
      <Text style={s.label}>EARNED VISIBILITY INDEX</Text>
      <View style={s.row}>
        <Text style={[s.score, { color: colors.electricPurple }]}>{score.toFixed(1)}</Text>
        <View style={s.meta}>
          <Text style={[s.delta, { color: delta >= 0 ? colors.green : colors.red }]}>
            {delta >= 0 ? '↑' : '↓'} {Math.abs(delta).toFixed(1)} pts
          </Text>
          <View style={[s.badge, { backgroundColor: cfg.color + '18' }]}>
            <Text style={[s.badgeText, { color: cfg.color }]}>{cfg.label}</Text>
          </View>
        </View>
      </View>
    </View>
  );
}

const s = StyleSheet.create({
  container: {},
  label: { fontSize: 10, fontWeight: '700', letterSpacing: 1.5, color: colors.textDim, marginBottom: 8 },
  row: { flexDirection: 'row', alignItems: 'flex-end', justifyContent: 'space-between' },
  score: { fontSize: 48, fontWeight: '800' },
  meta: { alignItems: 'flex-end', gap: 6 },
  delta: { fontSize: 16, fontWeight: '600' },
  badge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8 },
  badgeText: { fontSize: 11, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 0.5 },
});
