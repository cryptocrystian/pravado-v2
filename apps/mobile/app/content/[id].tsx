import { useEffect, useState } from 'react';
import { useLocalSearchParams } from 'expo-router';
import { View, Text, ScrollView, StyleSheet, Linking, TouchableOpacity } from 'react-native';
import { colors } from '../../src/constants/colors';
import { CiteMindBadge } from '../../src/components/CiteMindBadge';
import { EmptyState } from '../../src/components/EmptyState';
import { LoadingPulse } from '../../src/components/LoadingPulse';
import { apiFetch } from '../../src/lib/api';

interface ContentItem {
  id: string;
  title: string;
  content_type: string;
  status: string;
  body?: string;
  word_count: number;
  updated_at: string;
}

interface CiteMindScore {
  overall_score: number;
  gate_status: 'passed' | 'warning' | 'blocked';
  entity_density_score: number;
  claim_score: number;
  structure_score: number;
  authority_score: number;
  schema_score: number;
  citation_pattern_score: number;
}

const FACTORS = [
  { key: 'entity_density_score', label: 'Entity Density' },
  { key: 'claim_score', label: 'Claim Verifiability' },
  { key: 'structure_score', label: 'Structural Clarity' },
  { key: 'authority_score', label: 'Topical Authority' },
  { key: 'schema_score', label: 'Schema Markup' },
  { key: 'citation_pattern_score', label: 'Citation Patterns' },
] as const;

const GATE_MSG: Record<string, string> = {
  passed: 'Content meets citation quality standards — ready to publish.',
  warning: 'Content has areas for improvement but can be published.',
  blocked: 'Content does not meet quality standards — needs improvement before publishing.',
};

function barColor(score: number) {
  if (score >= 75) return colors.green;
  if (score >= 55) return colors.yellow;
  return colors.red;
}

export default function ContentDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const [item, setItem] = useState<ContentItem | null>(null);
  const [score, setScore] = useState<CiteMindScore | null>(null);
  const [loading, setLoading] = useState(true);
  const [expanded, setExpanded] = useState(false);

  useEffect(() => {
    Promise.all([
      apiFetch<ContentItem>(`/content/items/${id}`).catch(() => null),
      apiFetch<CiteMindScore>(`/citemind/score/${id}`).catch(() => null),
    ]).then(([c, s]) => {
      setItem(c);
      setScore(s);
      setLoading(false);
    });
  }, [id]);

  if (loading) {
    return (
      <ScrollView style={st.container} contentContainerStyle={st.content}>
        <LoadingPulse height={32} />
        <View style={{ height: 12 }} />
        <LoadingPulse height={200} />
      </ScrollView>
    );
  }

  if (!item) {
    return (
      <ScrollView style={st.container} contentContainerStyle={st.content}>
        <EmptyState icon="alert-circle" title="Content not found" subtitle="This item may have been deleted" />
      </ScrollView>
    );
  }

  const bodyPreview = item.body ? (expanded ? item.body : item.body.slice(0, 800)) : null;
  const gate = score?.gate_status || 'warning';

  return (
    <View style={st.container}>
      <ScrollView contentContainerStyle={st.content}>
        {/* Title + meta */}
        <Text style={st.title}>{item.title}</Text>
        <View style={st.metaRow}>
          <View style={[st.statusBadge, { backgroundColor: item.status === 'published' ? colors.green + '18' : item.status === 'draft' ? colors.textDim + '18' : colors.yellow + '18' }]}>
            <Text style={[st.statusText, { color: item.status === 'published' ? colors.green : item.status === 'draft' ? colors.textMuted : colors.yellow }]}>{item.status.toUpperCase()}</Text>
          </View>
          <Text style={st.typeBadge}>{item.content_type}</Text>
          <Text style={st.meta}>{item.word_count} words</Text>
        </View>

        {/* CiteMind Score */}
        {score && (
          <View style={st.card}>
            <View style={st.scoreHeader}>
              <Text style={st.cardTitle}>CiteMind Quality Score</Text>
              <CiteMindBadge score={score.overall_score} gate={gate} />
            </View>
            <Text style={st.gateMsg}>{GATE_MSG[gate]}</Text>

            <View style={st.factors}>
              {FACTORS.map(f => {
                const val = score[f.key as keyof CiteMindScore] as number;
                return (
                  <View key={f.key} style={st.factorRow}>
                    <Text style={st.factorLabel}>{f.label}</Text>
                    <View style={st.barBg}>
                      <View style={[st.barFill, { width: `${Math.min(val, 100)}%`, backgroundColor: barColor(val) }]} />
                    </View>
                    <Text style={[st.factorVal, { color: barColor(val) }]}>{Math.round(val)}</Text>
                  </View>
                );
              })}
            </View>
          </View>
        )}

        {/* Body preview */}
        {bodyPreview && (
          <View style={st.card}>
            <Text style={st.cardTitle}>Content Preview</Text>
            <Text style={st.bodyText}>{bodyPreview}{!expanded && item.body && item.body.length > 800 ? '...' : ''}</Text>
            {item.body && item.body.length > 800 && (
              <TouchableOpacity onPress={() => setExpanded(!expanded)}>
                <Text style={st.expandLink}>{expanded ? 'Show less' : 'Show full content'}</Text>
              </TouchableOpacity>
            )}
          </View>
        )}
      </ScrollView>

      {/* Actions bar */}
      <View style={st.actionsBar}>
        {gate === 'passed' && item.status === 'draft' && (
          <TouchableOpacity style={st.publishBtn}>
            <Text style={st.publishText}>Approve & Publish</Text>
          </TouchableOpacity>
        )}
        {gate === 'warning' && item.status === 'draft' && (
          <View style={st.warnActions}>
            <TouchableOpacity style={st.warnBtn}>
              <Text style={st.warnText}>Publish with Warning</Text>
            </TouchableOpacity>
            <TouchableOpacity style={st.outlineBtn}>
              <Text style={st.outlineText}>Improve First</Text>
            </TouchableOpacity>
          </View>
        )}
        {gate === 'blocked' && (
          <View style={st.blockedBar}>
            <Text style={st.blockedText}>Blocked — Improve Content</Text>
          </View>
        )}
        <TouchableOpacity style={st.openBtn} onPress={() => Linking.openURL(`https://app.pravado.io/app/content/${id}`)}>
          <Text style={st.openText}>Open in Pravado →</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const st = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg },
  content: { padding: 16, paddingBottom: 120 },
  title: { fontSize: 24, fontWeight: '700', color: colors.textPrimary, marginBottom: 12 },
  metaRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 20 },
  statusBadge: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 6 },
  statusText: { fontSize: 10, fontWeight: '800', letterSpacing: 0.5 },
  typeBadge: { fontSize: 12, color: colors.electricPurple, fontWeight: '600', textTransform: 'uppercase' },
  meta: { fontSize: 12, color: colors.textMuted },
  card: { backgroundColor: colors.surface, borderRadius: 12, borderWidth: 1, borderColor: colors.border, padding: 16, marginBottom: 16 },
  cardTitle: { fontSize: 14, fontWeight: '600', color: colors.textPrimary, marginBottom: 8 },
  scoreHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
  gateMsg: { fontSize: 13, color: colors.textMuted, marginBottom: 16, lineHeight: 18 },
  factors: { gap: 10 },
  factorRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  factorLabel: { fontSize: 12, color: colors.textSecondary, width: 110 },
  barBg: { flex: 1, height: 6, backgroundColor: colors.border, borderRadius: 3, overflow: 'hidden' },
  barFill: { height: '100%', borderRadius: 3 },
  factorVal: { fontSize: 12, fontWeight: '700', width: 28, textAlign: 'right' },
  bodyText: { fontSize: 14, color: colors.textSecondary, lineHeight: 20 },
  expandLink: { fontSize: 13, color: colors.cyberBlue, marginTop: 8, fontWeight: '600' },
  actionsBar: { position: 'absolute', bottom: 0, left: 0, right: 0, backgroundColor: colors.surface, borderTopWidth: 1, borderTopColor: colors.border, padding: 16, gap: 8 },
  publishBtn: { backgroundColor: colors.electricPurple, borderRadius: 10, paddingVertical: 14, alignItems: 'center' },
  publishText: { color: '#FFF', fontSize: 15, fontWeight: '600' },
  warnActions: { flexDirection: 'row', gap: 8 },
  warnBtn: { flex: 1, backgroundColor: colors.yellow + '18', borderWidth: 1, borderColor: colors.yellow + '30', borderRadius: 10, paddingVertical: 12, alignItems: 'center' },
  warnText: { color: colors.yellow, fontSize: 14, fontWeight: '600' },
  outlineBtn: { flex: 1, borderWidth: 1, borderColor: colors.border, borderRadius: 10, paddingVertical: 12, alignItems: 'center' },
  outlineText: { color: colors.textSecondary, fontSize: 14, fontWeight: '600' },
  blockedBar: { backgroundColor: colors.red + '18', borderRadius: 10, paddingVertical: 14, alignItems: 'center' },
  blockedText: { color: colors.red, fontSize: 14, fontWeight: '600' },
  openBtn: { borderWidth: 1, borderColor: colors.border, borderRadius: 10, paddingVertical: 12, alignItems: 'center' },
  openText: { color: colors.cyberBlue, fontSize: 14, fontWeight: '600' },
});
