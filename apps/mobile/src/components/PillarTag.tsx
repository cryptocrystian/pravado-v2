import { View, Text, StyleSheet } from 'react-native';
import { colors } from '../constants/colors';

const PILLAR_COLORS: Record<string, string> = { PR: colors.pr, Content: colors.content, SEO: colors.seo };

export function PillarTag({ pillar }: { pillar: string }) {
  const c = PILLAR_COLORS[pillar] || colors.textMuted;
  return (
    <View style={[s.tag, { backgroundColor: c + '18', borderColor: c + '30' }]}>
      <Text style={[s.text, { color: c }]}>{pillar}</Text>
    </View>
  );
}

const s = StyleSheet.create({
  tag: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 6, borderWidth: 1 },
  text: { fontSize: 10, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 0.5 },
});
