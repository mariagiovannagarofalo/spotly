import { Dimensions, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native'
import { colors, font, radii, spacing } from '../../lib/theme'
import { Plan } from '../../types'
import i18n from '../../lib/i18n'

const { width: SCREEN_WIDTH } = Dimensions.get('window')
const COL_WIDTH = (SCREEN_WIDTH - spacing.md * 2) / 7

type Props = {
  weekStart: Date
  plans: Plan[]
  selectedDate: string
  onSelectDate: (date: string) => void
  onPrev: () => void
  onNext: () => void
}

function toISO(date: Date) {
  return date.toISOString().split('T')[0]
}

function addDays(date: Date, n: number) {
  const d = new Date(date)
  d.setDate(d.getDate() + n)
  return d
}

export default function WeekView({ weekStart, plans, selectedDate, onSelectDate, onPrev, onNext }: Props) {
  const today = new Date().toISOString().split('T')[0]
  const days = Array.from({ length: 7 }, (_, i) => addDays(weekStart, i))
  const daysShort = i18n.t('days_short') as unknown as string[]

  const startISO = toISO(weekStart)
  const endISO = toISO(addDays(weekStart, 6))

  const weekPlans = plans.filter(p => {
    const start = p.start_date
    const end = p.end_date ?? p.start_date
    return end >= startISO && start <= endISO
  })

  return (
    <View style={s.container}>
      <View style={s.nav}>
        <TouchableOpacity onPress={onPrev} style={s.navBtn}>
          <Text style={s.navArrow}>‹</Text>
        </TouchableOpacity>
        <Text style={s.weekTitle}>
          {weekStart.toLocaleDateString(undefined, { day: 'numeric', month: 'short' })} –{' '}
          {addDays(weekStart, 6).toLocaleDateString(undefined, { day: 'numeric', month: 'short', year: 'numeric' })}
        </Text>
        <TouchableOpacity onPress={onNext} style={s.navBtn}>
          <Text style={s.navArrow}>›</Text>
        </TouchableOpacity>
      </View>

      {/* Day columns */}
      <View style={s.columnsRow}>
        {days.map((day, i) => {
          const iso = toISO(day)
          const isToday = iso === today
          const isSelected = iso === selectedDate
          const dayPlans = weekPlans.filter(p => {
            const end = p.end_date ?? p.start_date
            return iso >= p.start_date && iso <= end
          })

          return (
            <TouchableOpacity key={iso} style={s.col} onPress={() => onSelectDate(iso)}>
              <Text style={[s.colDay, isToday && s.todayText]}>{daysShort[i]}</Text>
              <View style={[s.colNum, isSelected && s.selectedCircle, isToday && !isSelected && s.todayCircle]}>
                <Text style={[s.colNumText, isSelected && s.selectedText, isToday && !isSelected && s.todayText]}>
                  {day.getDate()}
                </Text>
              </View>
              <View style={s.colEvents}>
                {dayPlans.map(p => (
                  <View key={p.id} style={[s.dot, { backgroundColor: p.color ?? colors.primary }]} />
                ))}
              </View>
            </TouchableOpacity>
          )
        })}
      </View>

      {/* Plans for selected day */}
      <ScrollView style={s.plansList} showsVerticalScrollIndicator={false}>
        {weekPlans
          .filter(p => {
            const end = p.end_date ?? p.start_date
            return selectedDate >= p.start_date && selectedDate <= end
          })
          .map(p => (
            <View key={p.id} style={[s.planItem, { borderLeftColor: p.color ?? colors.primary }]}>
              <Text style={s.planTitle}>{p.title}</Text>
              <Text style={s.planLocation}>📍 {p.location}</Text>
            </View>
          ))}
      </ScrollView>
    </View>
  )
}

const s = StyleSheet.create({
  container: { flex: 1, paddingHorizontal: spacing.md },
  nav: {
    flexDirection: 'row', justifyContent: 'space-between',
    alignItems: 'center', marginBottom: spacing.sm,
  },
  navBtn: { padding: spacing.sm },
  navArrow: { color: colors.white, fontSize: 28, fontWeight: '300' },
  weekTitle: { color: colors.white, ...font.label, textAlign: 'center', flex: 1 },
  columnsRow: { flexDirection: 'row', borderBottomWidth: 1, borderBottomColor: colors.border, paddingBottom: spacing.sm },
  col: { width: COL_WIDTH, alignItems: 'center', gap: spacing.xs },
  colDay: { color: colors.textDim, ...font.small },
  colNum: { width: 28, height: 28, borderRadius: 14, justifyContent: 'center', alignItems: 'center' },
  selectedCircle: { backgroundColor: colors.primary },
  todayCircle: { borderWidth: 1, borderColor: colors.primary },
  colNumText: { color: colors.textMuted, ...font.label },
  selectedText: { color: colors.white, fontWeight: '700' },
  todayText: { color: colors.primary },
  colEvents: { flexDirection: 'row', flexWrap: 'wrap', gap: 2, justifyContent: 'center' },
  dot: { width: 5, height: 5, borderRadius: 3 },
  plansList: { marginTop: spacing.md },
  planItem: {
    backgroundColor: colors.card, borderRadius: radii.md,
    padding: spacing.sm + 4, marginBottom: spacing.sm,
    borderLeftWidth: 4,
  },
  planTitle: { color: colors.white, ...font.label },
  planLocation: { color: colors.textDim, ...font.small, marginTop: 2 },
})
