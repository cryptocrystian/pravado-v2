import { useState } from 'react';
import { View, Text, ScrollView, RefreshControl, TouchableOpacity, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import { colors } from '../../src/constants/colors';
import { usePR } from '../../src/hooks/usePR';
import { EmptyState } from '../../src/components/EmptyState';

const TABS = ['Pitches', 'Coverage', 'Journalists'] as const;

const STATUS_COLORS: Record<string, string> = {
  draft: colors.textMuted, sent: colors.cyberBlue, opened: colors.yellow, responded: colors.green, placed: colors.green,
};

export default function PRScreen() {
  const [tab, setTab] = useState<typeof TABS[number]>('Pitches');
  const { pitches, coverage, journalists, loading, refresh } = usePR();
  const [refreshing, setRefreshing] = useState(false);
  const router = useRouter();

  const onRefresh = async () => { setRefreshing(true); await refresh(); setRefreshing(false); };

  return (
    <ScrollView style={s.container} refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.electricPurple} />}>
      <View style={s.tabs}>
        {TABS.map(t => (
          <TouchableOpacity key={t} style={[s.tab, tab === t && s.tabActive]} onPress={() => setTab(t)}>
            <Text style={[s.tabText, tab === t && s.tabTextActive]}>{t}</Text>
          </TouchableOpacity>
        ))}
      </View>

      {tab === 'Pitches' && (
        pitches.length === 0 ? <EmptyState icon="mail" title="No pitches yet" subtitle="Pitches you create will appear here" /> :
        pitches.map(p => (
          <TouchableOpacity key={p.id} style={[s.card, { borderLeftWidth: 3, borderLeftColor: STATUS_COLORS[p.status] || colors.textDim }]} onPress={() => router.push(`/pr/pitch/${p.id}`)}>
            <Text style={s.pitchName}>{p.journalist_name} · {p.outlet_name}</Text>
            <Text style={s.pitchSubject} numberOfLines={1}>{p.subject}</Text>
            <View style={s.pitchMeta}>
              <Text style={[s.statusBadge, { color: STATUS_COLORS[p.status] }]}>{p.status.toUpperCase()}</Text>
              {p.sent_at && <Text style={s.pitchDate}>{new Date(p.sent_at).toLocaleDateString()}</Text>}
            </View>
          </TouchableOpacity>
        ))
      )}

      {tab === 'Coverage' && (
        coverage.length === 0 ? <EmptyState icon="newspaper" title="No coverage yet" subtitle="Media coverage will appear as pitches land" /> :
        coverage.map(c => (
          <View key={c.id} style={s.card}>
            <Text style={s.covPub}>{c.publication}</Text>
            <Text style={s.covHeadline} numberOfLines={2}>{c.headline}</Text>
            <View style={s.covMeta}>
              <Text style={s.eviImpact}>+{c.evi_impact.toFixed(1)} EVI</Text>
              <Text style={s.covDate}>{new Date(c.published_at).toLocaleDateString()}</Text>
            </View>
          </View>
        ))
      )}

      {tab === 'Journalists' && (
        journalists.length === 0 ? <EmptyState icon="people" title="No journalists" subtitle="Journalist contacts will appear here" /> :
        journalists.map(j => (
          <View key={j.id} style={s.card}>
            <View style={s.journRow}>
              <View style={s.journAvatar}><Text style={s.journInitial}>{j.name[0]}</Text></View>
              <View style={{ flex: 1 }}>
                <Text style={s.journName}>{j.name}</Text>
                <Text style={s.journOutlet}>{j.outlet_name} · {j.beat}</Text>
              </View>
              <View style={[s.relBadge, { backgroundColor: j.relationship === 'active' ? '#22C55E18' : j.relationship === 'warm' ? '#F59E0B18' : '#3D3D4A18' }]}>
                <Text style={[s.relText, { color: j.relationship === 'active' ? colors.green : j.relationship === 'warm' ? colors.yellow : colors.textDim }]}>{j.relationship}</Text>
              </View>
            </View>
          </View>
        ))
      )}
    </ScrollView>
  );
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg, padding: 16 },
  tabs: { flexDirection: 'row', gap: 8, marginBottom: 16 },
  tab: { paddingHorizontal: 14, paddingVertical: 6, borderRadius: 8, backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border },
  tabActive: { backgroundColor: '#00D9FF18', borderColor: colors.cyberBlue },
  tabText: { fontSize: 13, fontWeight: '600', color: colors.textMuted },
  tabTextActive: { color: colors.cyberBlue },
  card: { backgroundColor: colors.surface, borderRadius: 12, borderWidth: 1, borderColor: colors.border, padding: 16, marginBottom: 12 },
  pitchName: { fontSize: 13, fontWeight: '600', color: colors.textSecondary },
  pitchSubject: { fontSize: 15, fontWeight: '600', color: colors.textPrimary, marginTop: 4 },
  pitchMeta: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 8 },
  statusBadge: { fontSize: 10, fontWeight: '800', letterSpacing: 0.5 },
  pitchDate: { fontSize: 12, color: colors.textDim },
  covPub: { fontSize: 12, fontWeight: '600', color: colors.cyberBlue, textTransform: 'uppercase' },
  covHeadline: { fontSize: 15, fontWeight: '600', color: colors.textPrimary, marginTop: 4 },
  covMeta: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 8 },
  eviImpact: { fontSize: 13, fontWeight: '700', color: colors.green },
  covDate: { fontSize: 12, color: colors.textDim },
  journRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  journAvatar: { width: 36, height: 36, borderRadius: 18, backgroundColor: '#A855F718', alignItems: 'center', justifyContent: 'center' },
  journInitial: { fontSize: 14, fontWeight: '700', color: colors.electricPurple },
  journName: { fontSize: 15, fontWeight: '600', color: colors.textPrimary },
  journOutlet: { fontSize: 12, color: colors.textMuted, marginTop: 2 },
  relBadge: { paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6 },
  relText: { fontSize: 10, fontWeight: '700', textTransform: 'uppercase' },
});
