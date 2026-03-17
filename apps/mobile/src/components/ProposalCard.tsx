import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { colors } from '../constants/colors';
import { PillarTag } from './PillarTag';

const PRIORITY_COLORS: Record<string, string> = {
  critical: colors.red, high: colors.yellow, medium: colors.cyberBlue, low: colors.textDim,
};

interface Props {
  proposal: { id: string; title: string; rationale: string; pillar: string; priority: string; evi_impact_estimate: number; confidence: number };
  onApprove: () => void;
  onDismiss: () => void;
}

export function ProposalCard({ proposal, onApprove, onDismiss }: Props) {
  const pillarColor = proposal.pillar === 'PR' ? colors.pr : proposal.pillar === 'Content' ? colors.content : colors.seo;
  return (
    <View style={[s.card, { borderLeftColor: pillarColor }]}>
      <View style={s.top}>
        <View style={[s.priority, { backgroundColor: (PRIORITY_COLORS[proposal.priority] || colors.textDim) + '18' }]}>
          <Text style={[s.priorityText, { color: PRIORITY_COLORS[proposal.priority] }]}>{proposal.priority.toUpperCase()}</Text>
        </View>
        <PillarTag pillar={proposal.pillar} />
      </View>
      <Text style={s.title} numberOfLines={2}>{proposal.title}</Text>
      <Text style={s.rationale} numberOfLines={2}>{proposal.rationale}</Text>
      <View style={s.footer}>
        <View style={s.eviChip}><Text style={s.eviText}>+{proposal.evi_impact_estimate.toFixed(1)} EVI</Text></View>
        <View style={s.actions}>
          <TouchableOpacity onPress={onDismiss}><Text style={s.dismissText}>Dismiss</Text></TouchableOpacity>
          <TouchableOpacity style={s.approveBtn} onPress={onApprove}><Text style={s.approveText}>Approve</Text></TouchableOpacity>
        </View>
      </View>
    </View>
  );
}

const s = StyleSheet.create({
  card: { backgroundColor: colors.surface, borderRadius: 12, borderWidth: 1, borderColor: colors.border, borderLeftWidth: 3, padding: 16, marginBottom: 12 },
  top: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 8 },
  priority: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 6 },
  priorityText: { fontSize: 9, fontWeight: '800', letterSpacing: 0.5 },
  title: { fontSize: 15, fontWeight: '600', color: colors.textPrimary, marginBottom: 4 },
  rationale: { fontSize: 13, color: colors.textMuted, lineHeight: 18, marginBottom: 12 },
  footer: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  eviChip: { backgroundColor: '#22C55E18', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6 },
  eviText: { fontSize: 12, fontWeight: '700', color: colors.green },
  actions: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  dismissText: { fontSize: 13, color: colors.red, fontWeight: '600' },
  approveBtn: { backgroundColor: colors.green, paddingHorizontal: 14, paddingVertical: 6, borderRadius: 8 },
  approveText: { color: '#FFF', fontSize: 13, fontWeight: '600' },
});
