import { StyleSheet, Text, TouchableOpacity, View } from 'react-native'
import { colors, font, radii, spacing } from '../../lib/theme'

const DAYS = ['Lun', 'Mar', 'Mer', 'Gio', 'Ven', 'Sab', 'Dom']
const MONTHS = [
  'Gennaio', 'Febbraio', 'Marzo', 'Aprile', 'Maggio', 'Giugno',
  'Luglio', 'Agosto', 'Settembre', 'Ottobre', 'Novembre', 'Dicembre',
]

type Props = {
  year: number
  month: number // 0-indexed
  selectedDate: string | null
  datesWithPlans: Set<string>
  onSelectDate: (date: string) => void
  onPrevMonth: () => void
  onNextMonth: () => void
}

export default function MonthGrid({
  year, month, selectedDate, datesWithPlans, onSelectDate, onPrevMonth, onNextMonth,
}: Props) {
  const today = new Date().toISOString().split('T')[0]
  const firstDay = new Date(year, month, 1)
  // Monday-based: 0=Mon...6=Sun
  const startOffset = (firstDay.getDay() + 6) % 7
  const daysInMonth = new Date(year, month + 1, 0).getDate()
  const cells: (number | null)[] = [
    ...Array(startOffset).fill(null),
    ...Array.from({ length: daysInMonth }, (_, i) => i + 1),
  ]
  // Pad to complete last row
  while (cells.length % 7 !== 0) cells.push(null)

  function toISO(day: number) {
    const m = String(month + 1).padStart(2, '0')
    const d = String(day).padStart(2, '0')
    return `${year}-${m}-${d}`
  }

  return (
    <View style={s.container}>
      <View style={s.nav}>
        <TouchableOpacity onPress={onPrevMonth} style={s.navBtn}>
          <Text style={s.navArrow}>‹</Text>
        </TouchableOpacity>
        <Text style={s.monthTitle}>{MONTHS[month]} {year}</Text>
        <TouchableOpacity onPress={onNextMonth} style={s.navBtn}>
          <Text style={s.navArrow}>›</Text>
        </TouchableOpacity>
      </View>

      <View style={s.daysRow}>
        {DAYS.map(d => (
          <Text key={d} style={s.dayLabel}>{d}</Text>
        ))}
      </View>

      <View style={s.grid}>
        {cells.map((day, i) => {
          if (!day) return <View key={`empty-${i}`} style={s.cell} />
          const iso = toISO(day)
          const isToday = iso === today
          const isSelected = iso === selectedDate
          const hasPlan = datesWithPlans.has(iso)

          return (
            <TouchableOpacity key={iso} style={s.cell} onPress={() => onSelectDate(iso)}>
              <View style={[
                s.dayCircle,
                isSelected && s.selectedCircle,
                isToday && !isSelected && s.todayCircle,
              ]}>
                <Text style={[
                  s.dayText,
                  isSelected && s.selectedText,
                  isToday && !isSelected && s.todayText,
                ]}>
                  {day}
                </Text>
              </View>
              {hasPlan && <View style={[s.dot, isSelected && s.dotSelected]} />}
            </TouchableOpacity>
          )
        })}
      </View>
    </View>
  )
}

const s = StyleSheet.create({
  container: { paddingHorizontal: spacing.md, paddingTop: spacing.sm },
  nav: {
    flexDirection: 'row', justifyContent: 'space-between',
    alignItems: 'center', marginBottom: spacing.md,
  },
  navBtn: { padding: spacing.sm },
  navArrow: { color: colors.white, fontSize: 28, fontWeight: '300' },
  monthTitle: { color: colors.white, ...font.title },
  daysRow: { flexDirection: 'row', marginBottom: spacing.xs },
  dayLabel: {
    flex: 1, textAlign: 'center',
    color: colors.textDim, ...font.small,
  },
  grid: { flexDirection: 'row', flexWrap: 'wrap' },
  cell: {
    width: `${100 / 7}%`,
    alignItems: 'center',
    paddingVertical: spacing.xs,
  },
  dayCircle: {
    width: 34, height: 34, borderRadius: 17,
    justifyContent: 'center', alignItems: 'center',
  },
  selectedCircle: { backgroundColor: colors.primary },
  todayCircle: { borderWidth: 1, borderColor: colors.primary },
  dayText: { color: colors.textMuted, ...font.label },
  selectedText: { color: colors.white, fontWeight: '700' },
  todayText: { color: colors.primary },
  dot: {
    width: 4, height: 4, borderRadius: 2,
    backgroundColor: colors.primary, marginTop: 2,
  },
  dotSelected: { backgroundColor: colors.white },
})
