import { useEffect, useState } from 'react';
import { useLocalSearchParams } from 'expo-router';
import { View, Text, ScrollView, StyleSheet, Linking, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../../../src/constants/colors';
import { EmptyState } from '../../../src/components/EmptyState';
import { LoadingPulse } from '../../../src/components/LoadingPulse';
import { apiFetch } from '../../../src/lib/api';

interface Pitch {
  id: string;
  subject: string;
  body?: string;
  journalist_id?: string;
  journalist_name: string;
  outlet_name: string;
  status: string;
  evi_impact?: number;
  sent_at?: string;
  opened_at?: string;
  responded_at?: string;
  placed_at?: string;
  created_at: string;
}

const STATUS_COLORS: Record<string, string> = {
  draft: colors.textMuted, sent: colors.cyberBlue, opened: colors.yellow,
  responded: colors.green, placed: colors.green,
};

const TIMELINE_STEPS = ['Created', 'Sent', 'Opened', 'Responded', 'Placed'] as const;
const TIMELINE_KEYS: Record<string, string> = {
  Created: 'created_at', Sent: 'sent_at', Opened: 'opened_at',
  Responded: 'responded_at', Placed: 'placed_at',
};

export default function PitchDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const [pitch, setPitch] = useState<Pitch | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    apiFetch<Pitch>(`/pr/pitches/${id}`)
      .then(setPitch)
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) {
    return (
      <ScrollView style={st.container} contentContainerStyle={st.content}>
        <LoadingPulse height={24} />
        <View style={{ height: 12 }} />
        <LoadingPulse height={200} />
      </ScrollView>
    );
  }

  if (!pitch) {
    return (
      <ScrollView style={st.container} contentContainerStyle={st.content}>
        <EmptyState icon="alert-circle" title="Pitch not found" subtitle="This pitch may have been deleted" />
      </ScrollView>
    );
  }

  return (
    <View style={st.container}>
      <ScrollView contentContainerStyle={st.content}>
        {/* Status */}
        <View style={[st.statusBadge, { backgroundColor: (STATUS_COLORS[pitch.status] || colors.textDim) + '18' }]}>
          <Text style={[st.statusText, { color: STATUS_COLORS[pitch.status] || colors.textDim }]}>
            {pitch.status.toUpperCase()}
          </Text>
        </View>

        {/* Journalist */}
        <View style={st.card}>
          <View style={st.journRow}>
            <View style={st.avatar}><Text style={st.avatarText}>{pitch.journalist_name[0]}</Text></View>
            <View style={{ flex: 1 }}>
              <Text style={st.journName}>{pitch.journalist_name}</Text>
              <Text style={st.journOutlet}>{pitch.outlet_name}</Text>
            </View>
          </View>
        </View>

        {/* Pitch content */}
        <View style={st.card}>
          <Text style={st.subject}>{pitch.subject}</Text>
          {pitch.body && <Text style={st.body}>{pitch.body}</Text>}
        </View>

        {/* Timeline */}
        <View style={st.card}>
          <Text style={st.cardTitle}>Status Timeline</Text>
          {TIMELINE_STEPS.map((step, i) => {
            const key = TIMELINE_KEYS[step];
            const ts = (pitch as any)[key] as string | undefined;
            const reached = !!ts;
            return (
              <View key={step} style={st.timelineRow}>
                <View style={st.timelineLeft}>
                  <View style={[st.dot, { backgroundColor: reached ? colors.green : colors.border }]} />
                  {i < TIMELINE_STEPS.length - 1 && <View style={[st.line, { backgroundColor: reached ? colors.green + '40' : colors.border }]} />}
                </View>
                <View style={st.timelineContent}>
                  <Text style={[st.stepLabel, { color: reached ? colors.textPrimary : colors.textDim }]}>{step}</Text>
                  {ts && <Text style={st.stepDate}>{new Date(ts).toLocaleDateString()}</Text>}
                </View>
              </View>
            );
          })}
        </View>

        {/* EVI Attribution */}
        {pitch.status === 'placed' && pitch.evi_impact != null && (
          <View style={[st.card, { borderColor: colors.green + '30' }]}>
            <Text style={st.eviLabel}>EVI Attribution</Text>
            <Text style={st.eviValue}>+{pitch.evi_impact.toFixed(1)} EVI</Text>
            <Text style={st.eviSub}>Attributed to this media placement</Text>
          </View>
        )}
      </ScrollView>

      {/* Actions */}
      <View style={st.actionsBar}>
        {pitch.status === 'draft' && (
          <TouchableOpacity style={st.editBtn} onPress={() => Linking.openURL(`https://app.pravado.io/app/pr/pitches/${id}`)}>
            <Text style={st.editText}>Edit in Pravado →</Text>
          </TouchableOpacity>
        )}
        <TouchableOpacity style={st.openBtn} onPress={() => Linking.openURL(`https://app.pravado.io/app/pr/pitches/${id}`)}>
          <Text style={st.openText}>Open in Pravado →</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const st = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg },
  content: { padding: 16, paddingBottom: 120 },
  statusBadge: { alignSelf: 'flex-start', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8, marginBottom: 16 },
  statusText: { fontSize: 11, fontWeight: '800', letterSpacing: 0.5 },
  card: { backgroundColor: colors.surface, borderRadius: 12, borderWidth: 1, borderColor: colors.border, padding: 16, marginBottom: 16 },
  cardTitle: { fontSize: 14, fontWeight: '600', color: colors.textPrimary, marginBottom: 12 },
  journRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  avatar: { width: 40, height: 40, borderRadius: 20, backgroundColor: '#A855F718', alignItems: 'center', justifyContent: 'center' },
  avatarText: { fontSize: 16, fontWeight: '700', color: colors.electricPurple },
  journName: { fontSize: 16, fontWeight: '600', color: colors.textPrimary },
  journOutlet: { fontSize: 13, color: colors.textMuted, marginTop: 2 },
  subject: { fontSize: 18, fontWeight: '700', color: colors.textPrimary, marginBottom: 12 },
  body: { fontSize: 14, color: colors.textSecondary, lineHeight: 22 },
  timelineRow: { flexDirection: 'row', minHeight: 40 },
  timelineLeft: { width: 24, alignItems: 'center' },
  dot: { width: 10, height: 10, borderRadius: 5, marginTop: 4 },
  line: { width: 2, flex: 1, marginVertical: 2 },
  timelineContent: { flex: 1, paddingLeft: 12, paddingBottom: 12 },
  stepLabel: { fontSize: 14, fontWeight: '600' },
  stepDate: { fontSize: 12, color: colors.textMuted, marginTop: 2 },
  eviLabel: { fontSize: 12, color: colors.textMuted, marginBottom: 4 },
  eviValue: { fontSize: 24, fontWeight: '800', color: colors.green },
  eviSub: { fontSize: 13, color: colors.textMuted, marginTop: 4 },
  actionsBar: { position: 'absolute', bottom: 0, left: 0, right: 0, backgroundColor: colors.surface, borderTopWidth: 1, borderTopColor: colors.border, padding: 16, gap: 8 },
  editBtn: { backgroundColor: colors.electricPurple, borderRadius: 10, paddingVertical: 14, alignItems: 'center' },
  editText: { color: '#FFF', fontSize: 15, fontWeight: '600' },
  openBtn: { borderWidth: 1, borderColor: colors.border, borderRadius: 10, paddingVertical: 12, alignItems: 'center' },
  openText: { color: colors.cyberBlue, fontSize: 14, fontWeight: '600' },
});
