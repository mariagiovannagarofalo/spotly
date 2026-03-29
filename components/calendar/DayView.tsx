import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native'
import { colors, font, radii, spacing } from '../../lib/theme'
import { Plan } from '../../types'

type Props = {
  date: string
  plans: Plan[]
  onPrev: () => void
  onNext: () => void
}

function formatFullDate(iso: string) {
  return new Date(iso).toLocaleDateString(undefined, {
    weekday: 'long', day: 'numeric', month: 'long', year: 'numeric',
  })
}

export default function DayView({ date, plans, onPrev, onNext }: Props) {
  const dayPlans = plans.filter(p => {
    const end = p.end_date ?? p.start_date
    return date >= p.start_date && date <= end
  })

  return (
    <View style={s.container}>
      <View style={s.nav}>
        <TouchableOpacity onPress={onPrev} style={s.navBtn}>
          <Text style={s.navArrow}>‹</Text>
        </TouchableOpacity>
        <Text style={s.dateTitle} numberOfLines={1}>{formatFullDate(date)}</Text>
        <TouchableOpacity onPress={onNext} style={s.navBtn}>
          <Text style={s.navArrow}>›</Text>
        </TouchableOpacity>
      </View>

      <ScrollView showsVerticalScrollIndicator={false}>
        {dayPlans.length === 0 ? (
          <View style={s.empty}>
            <Text style={s.emptyText}>Nessun piano per oggi.</Text>
          </View>
        ) : (
          dayPlans.map(p => (
            <View key={p.id} style={[s.planCard, { borderLeftColor: p.color ?? colors.primary }]}>
              <View style={[s.colorDot, { backgroundColor: p.color ?? colors.primary }]} />
              <View style={s.planInfo}>
                <Text style={s.planTitle}>{p.title}</Text>
                {p.activity && <Text style={s.planActivity}>{p.activity}</Text>}
                <Text style={s.planLocation}>📍 {p.location}</Text>
                <Text style={s.planDate}>
                  {p.start_date}{p.end_date && p.end_date !== p.start_date ? ` → ${p.end_date}` : ''}
                </Text>
                {p.description && <Text style={s.planDesc}>{p.description}</Text>}
                <Text style={s.planAuthor}>@{p.profiles?.username}</Text>
              </View>
            </View>
          ))
        )}
      </ScrollView>
    </View>
  )
}

const s = StyleSheet.create({
  container: { flex: 1, paddingHorizontal: spacing.md },
  nav: {
    flexDirection: 'row', justifyContent: 'space-between',
    alignItems: 'center', marginBottom: spacing.md,
  },
  navBtn: { padding: spacing.sm },
  navArrow: { color: colors.white, fontSize: 28, fontWeight: '300' },
  dateTitle: { color: colors.white, ...font.label, flex: 1, textAlign: 'center', textTransform: 'capitalize' },
  empty: { paddingTop: spacing.xl, alignItems: 'center' },
  emptyText: { color: colors.textDim, ...font.label },
  planCard: {
    flexDirection: 'row', backgroundColor: colors.card,
    borderRadius: radii.md, padding: spacing.md,
    marginBottom: spacing.sm, borderLeftWidth: 4, gap: spacing.sm,
  },
  colorDot: { width: 8, height: 8, borderRadius: 4, marginTop: 4 },
  planInfo: { flex: 1 },
  planTitle: { color: colors.white, ...font.heading, marginBottom: 2 },
  planActivity: { color: colors.textDim, ...font.small, marginBottom: 2 },
  planLocation: { color: colors.primary, ...font.label, marginBottom: 2 },
  planDate: { color: colors.textDim, ...font.small, marginBottom: 2 },
  planDesc: { color: colors.textMuted, ...font.small, marginBottom: 4 },
  planAuthor: { color: colors.textDim, ...font.small },
})
