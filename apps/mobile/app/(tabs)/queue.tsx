import { useState } from 'react';
import { View, Text, ScrollView, RefreshControl, TouchableOpacity, StyleSheet } from 'react-native';
import { colors } from '../../src/constants/colors';
import { useSAGE } from '../../src/hooks/useSAGE';
import { ProposalCard } from '../../src/components/ProposalCard';
import { EmptyState } from '../../src/components/EmptyState';
import { PillarTag } from '../../src/components/PillarTag';

const FILTERS = ['All', 'PR', 'Content', 'SEO'] as const;

export default function QueueScreen() {
  const { proposals, loading, approve, dismiss, refresh } = useSAGE();
  const [filter, setFilter] = useState<typeof FILTERS[number]>('All');
  const [refreshing, setRefreshing] = useState(false);

  const onRefresh = async () => { setRefreshing(true); await refresh(); setRefreshing(false); };

  const filtered = filter === 'All' ? proposals : proposals.filter(p => p.pillar === filter);
  const sorted = [...filtered].sort((a, b) => b.evi_impact_estimate - a.evi_impact_estimate);

  return (
    <ScrollView style={s.container} refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.electricPurple} />}>
      <View style={s.filters}>
        {FILTERS.map(f => (
          <TouchableOpacity key={f} style={[s.chip, filter === f && s.chipActive]} onPress={() => setFilter(f)}>
            <Text style={[s.chipText, filter === f && s.chipTextActive]}>{f}</Text>
          </TouchableOpacity>
        ))}
      </View>
      <View style={s.list}>
        {sorted.length === 0 ? (
          <EmptyState icon="checkmark-circle" title="All caught up" subtitle="No pending actions" />
        ) : (
          sorted.map(p => <ProposalCard key={p.id} proposal={p} onApprove={() => approve(p.id)} onDismiss={() => dismiss(p.id)} />)
        )}
      </View>
    </ScrollView>
  );
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg, padding: 16 },
  filters: { flexDirection: 'row', gap: 8, marginBottom: 16 },
  chip: { paddingHorizontal: 14, paddingVertical: 6, borderRadius: 8, backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border },
  chipActive: { backgroundColor: '#A855F718', borderColor: colors.electricPurple },
  chipText: { fontSize: 13, fontWeight: '600', color: colors.textMuted },
  chipTextActive: { color: colors.electricPurple },
  list: { gap: 12 },
});
