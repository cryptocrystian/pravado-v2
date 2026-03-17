import { useEffect, useState } from 'react';
import { View, Text, ScrollView, RefreshControl, TouchableOpacity, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import { colors } from '../../src/constants/colors';
import { useEVI } from '../../src/hooks/useEVI';
import { useSAGE } from '../../src/hooks/useSAGE';
import { supabase } from '../../src/lib/supabase';
import { EVIScore } from '../../src/components/EVIScore';
import { ProposalCard } from '../../src/components/ProposalCard';
import { EmptyState } from '../../src/components/EmptyState';

function getGreeting() {
  const h = new Date().getHours();
  if (h < 12) return 'Good morning';
  if (h < 17) return 'Good afternoon';
  return 'Good evening';
}

export default function TodayScreen() {
  const router = useRouter();
  const { data: evi, loading: eviLoading, refresh: refreshEVI } = useEVI();
  const { proposals, dailyBrief, loading: sageLoading, approve, dismiss, refresh: refreshSAGE } = useSAGE();
  const [userName, setUserName] = useState('');
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      setUserName(user?.user_metadata?.full_name?.split(' ')[0] || user?.email?.split('@')[0] || '');
    });
  }, []);

  const onRefresh = async () => {
    setRefreshing(true);
    await Promise.all([refreshEVI(), refreshSAGE()]);
    setRefreshing(false);
  };

  const pending = proposals.filter(p => p.status === 'active' || p.status === 'ready');
  const today = new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' });

  return (
    <ScrollView style={s.container} contentContainerStyle={s.content} refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.electricPurple} />}>
      {/* Header */}
      <View style={s.header}>
        <Text style={s.greeting}>{getGreeting()}, {userName}</Text>
        <Text style={s.date}>{today}</Text>
      </View>

      {/* EVI Card */}
      <TouchableOpacity style={s.card} onPress={() => router.push('/(tabs)/analytics')} activeOpacity={0.7}>
        {evi ? <EVIScore score={evi.score} delta={evi.delta_7d} status={evi.status} sparkline={evi.sparkline} /> : (
          <View style={s.emptyEvi}>
            <Text style={s.emptyText}>EVI score loading...</Text>
          </View>
        )}
      </TouchableOpacity>

      {/* SAGE Brief */}
      <View style={[s.card, s.briefCard]}>
        <View style={s.briefHeader}>
          <View style={s.sagePill}><Text style={s.sagePillText}>SAGE ACTIVE</Text></View>
        </View>
        <Text style={s.briefText}>
          {dailyBrief || 'SAGE is analyzing your signals. Your first daily brief will appear once enough data has been collected.'}
        </Text>
      </View>

      {/* Pending Actions */}
      <View style={s.section}>
        <View style={s.sectionHeader}>
          <Text style={s.sectionTitle}>{pending.length} pending action{pending.length !== 1 ? 's' : ''}</Text>
          {pending.length > 0 && (
            <TouchableOpacity onPress={() => router.push('/(tabs)/queue')}>
              <Text style={s.seeAll}>See all</Text>
            </TouchableOpacity>
          )}
        </View>
        {pending.length === 0 ? (
          <EmptyState icon="checkmark-circle" title="All caught up" subtitle="SAGE is monitoring your signals" />
        ) : (
          pending.slice(0, 3).map(p => (
            <ProposalCard key={p.id} proposal={p} onApprove={() => approve(p.id)} onDismiss={() => dismiss(p.id)} />
          ))
        )}
      </View>
    </ScrollView>
  );
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg },
  content: { padding: 16, paddingBottom: 32 },
  header: { marginBottom: 20 },
  greeting: { fontSize: 24, fontWeight: '700', color: colors.textPrimary },
  date: { fontSize: 14, color: colors.textMuted, marginTop: 4 },
  card: { backgroundColor: colors.surface, borderRadius: 16, borderWidth: 1, borderColor: colors.border, padding: 20, marginBottom: 16 },
  briefCard: { borderColor: '#A855F720' },
  briefHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 12 },
  sagePill: { backgroundColor: '#A855F718', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8, borderWidth: 1, borderColor: '#A855F730' },
  sagePillText: { fontSize: 10, fontWeight: '800', letterSpacing: 1.5, color: colors.electricPurple },
  briefText: { fontSize: 14, lineHeight: 20, color: colors.textSecondary },
  emptyEvi: { height: 80, justifyContent: 'center', alignItems: 'center' },
  emptyText: { color: colors.textMuted, fontSize: 14 },
  section: { marginTop: 8 },
  sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  sectionTitle: { fontSize: 15, fontWeight: '600', color: colors.textPrimary },
  seeAll: { fontSize: 13, color: colors.cyberBlue },
});
