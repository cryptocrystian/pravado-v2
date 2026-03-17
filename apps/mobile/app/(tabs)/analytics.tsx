import { useState } from 'react';
import { View, Text, ScrollView, RefreshControl, StyleSheet, TouchableOpacity } from 'react-native';
import { colors } from '../../src/constants/colors';
import { useEVI } from '../../src/hooks/useEVI';
import { EVIScore } from '../../src/components/EVIScore';
import { EmptyState } from '../../src/components/EmptyState';

const RANGES = ['7d', '30d', '60d', '90d'] as const;

export default function AnalyticsScreen() {
  const [range, setRange] = useState<string>('30d');
  const { data: evi, history, loading, refresh } = useEVI(range);
  const [refreshing, setRefreshing] = useState(false);

  const onRefresh = async () => { setRefreshing(true); await refresh(); setRefreshing(false); };

  return (
    <ScrollView style={s.container} contentContainerStyle={s.content} refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.electricPurple} />}>
      <View style={s.ranges}>
        {RANGES.map(r => (
          <TouchableOpacity key={r} style={[s.rangeBtn, range === r && s.rangeBtnActive]} onPress={() => setRange(r)}>
            <Text style={[s.rangeText, range === r && s.rangeTextActive]}>{r}</Text>
          </TouchableOpacity>
        ))}
      </View>

      <View style={s.card}>
        {evi ? <EVIScore score={evi.score} delta={evi.delta_7d} status={evi.status} sparkline={evi.sparkline} /> : (
          <EmptyState icon="analytics" title="No EVI data" subtitle="EVI will appear after first calculation" />
        )}
      </View>

      {evi?.drivers && (
        <View style={s.drivers}>
          {evi.drivers.map(d => (
            <View key={d.type} style={s.driverCard}>
              <Text style={s.driverLabel}>{d.label}</Text>
              <Text style={s.driverScore}>{d.score.toFixed(1)}</Text>
              <Text style={[s.driverDelta, { color: d.delta_7d >= 0 ? colors.green : colors.red }]}>
                {d.delta_7d >= 0 ? '+' : ''}{d.delta_7d.toFixed(1)}
              </Text>
            </View>
          ))}
        </View>
      )}

      <EmptyState icon="trophy" title="Top Wins" subtitle="Your wins will appear as SAGE tracks visibility improvements" />
    </ScrollView>
  );
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg },
  content: { padding: 16, paddingBottom: 32 },
  ranges: { flexDirection: 'row', gap: 8, marginBottom: 16 },
  rangeBtn: { paddingHorizontal: 14, paddingVertical: 6, borderRadius: 8, backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border },
  rangeBtnActive: { backgroundColor: '#A855F718', borderColor: colors.electricPurple },
  rangeText: { fontSize: 13, fontWeight: '600', color: colors.textMuted },
  rangeTextActive: { color: colors.electricPurple },
  card: { backgroundColor: colors.surface, borderRadius: 16, borderWidth: 1, borderColor: colors.border, padding: 20, marginBottom: 16 },
  drivers: { flexDirection: 'row', gap: 8, marginBottom: 16 },
  driverCard: { flex: 1, backgroundColor: colors.surface, borderRadius: 12, borderWidth: 1, borderColor: colors.border, padding: 12, alignItems: 'center' },
  driverLabel: { fontSize: 11, color: colors.textMuted, fontWeight: '600', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 4 },
  driverScore: { fontSize: 22, fontWeight: '700', color: colors.textPrimary },
  driverDelta: { fontSize: 12, fontWeight: '600', marginTop: 2 },
});
