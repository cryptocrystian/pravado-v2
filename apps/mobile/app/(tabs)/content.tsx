import { useState } from 'react';
import { View, Text, ScrollView, RefreshControl, TouchableOpacity, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import { colors } from '../../src/constants/colors';
import { useContent } from '../../src/hooks/useContent';
import { CiteMindBadge } from '../../src/components/CiteMindBadge';
import { EmptyState } from '../../src/components/EmptyState';

const TABS = ['All', 'Drafts', 'Published', 'Review'] as const;
const STATUS_MAP: Record<string, string> = { All: '', Drafts: 'draft', Published: 'published', Review: 'needs_review' };

export default function ContentScreen() {
  const [tab, setTab] = useState<string>('All');
  const { items, loading, refresh } = useContent(STATUS_MAP[tab] || undefined);
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
      {items.length === 0 ? (
        <EmptyState icon="document-text" title="No content yet" subtitle="Content you create in Pravado will appear here" />
      ) : (
        items.map(item => (
          <TouchableOpacity key={item.id} style={s.card} onPress={() => router.push(`/content/${item.id}`)}>
            <View style={s.cardHeader}>
              <Text style={s.cardTitle} numberOfLines={2}>{item.title}</Text>
              {item.citemind_gate && <CiteMindBadge score={item.citemind_score} gate={item.citemind_gate} />}
            </View>
            <View style={s.cardMeta}>
              <Text style={s.cardType}>{item.content_type}</Text>
              <Text style={s.cardDot}> · </Text>
              <Text style={s.cardInfo}>{item.word_count || 0} words</Text>
              <Text style={s.cardDot}> · </Text>
              <Text style={s.cardInfo}>{new Date(item.updated_at).toLocaleDateString()}</Text>
            </View>
          </TouchableOpacity>
        ))
      )}
    </ScrollView>
  );
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg, padding: 16 },
  tabs: { flexDirection: 'row', gap: 8, marginBottom: 16 },
  tab: { paddingHorizontal: 14, paddingVertical: 6, borderRadius: 8, backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border },
  tabActive: { backgroundColor: '#A855F718', borderColor: colors.electricPurple },
  tabText: { fontSize: 13, fontWeight: '600', color: colors.textMuted },
  tabTextActive: { color: colors.electricPurple },
  card: { backgroundColor: colors.surface, borderRadius: 12, borderWidth: 1, borderColor: colors.border, padding: 16, marginBottom: 12 },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 8 },
  cardTitle: { fontSize: 15, fontWeight: '600', color: colors.textPrimary, flex: 1, marginRight: 8 },
  cardMeta: { flexDirection: 'row', alignItems: 'center' },
  cardType: { fontSize: 12, color: colors.electricPurple, fontWeight: '600', textTransform: 'uppercase' },
  cardDot: { color: colors.textDim },
  cardInfo: { fontSize: 12, color: colors.textMuted },
});
