import { Dimensions, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native'
import { colors, font, radii, spacing } from '../../lib/theme'
import { Plan } from '../../types'
import i18n from '../../lib/i18n'

const { width: SCREEN_WIDTH } = Dimensions.get('window')
const CELL_WIDTH = (SCREEN_WIDTH - spacing.md * 2) / 7

type Props = {
  year: number
  month: number
  selectedDate: string | null
  plans: Plan[]
  onSelectDate: (date: string) => void
  onPrevMonth: () => void
  onNextMonth: () => void
}

function toISO(year: number, month: number, day: number) {
  return `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`
}

function getWeeks(year: number, month: number): (number | null)[][] {
  const firstDay = new Date(year, month, 1)
  const startOffset = (firstDay.getDay() + 6) % 7
  const daysInMonth = new Date(year, month + 1, 0).getDate()
  const cells: (number | null)[] = [
    ...Array(startOffset).fill(null),
    ...Array.from({ length: daysInMonth }, (_, i) => i + 1),
  ]
  while (cells.length % 7 !== 0) cells.push(null)
  const weeks: (number | null)[][] = []
  for (let i = 0; i < cells.length; i += 7) weeks.push(cells.slice(i, i + 7))
  return weeks
}

function getBarsForWeek(
  week: (number | null)[],
  year: number,
  month: number,
  plans: Plan[]
): { plan: Plan; startCol: number; endCol: number }[] {
  const weekDates = week.map(d => d ? toISO(year, month, d) : null)
  const weekStart = weekDates.find(Boolean)!
  const weekEnd = [...weekDates].reverse().find(Boolean)!
  if (!weekStart || !weekEnd) return []

  const bars: { plan: Plan; startCol: number; endCol: number }[] = []
  for (const plan of plans) {
    const planStart = plan.start_date
    const planEnd = plan.end_date ?? plan.start_date
    if (planEnd < weekStart || planStart > weekEnd) continue

    let startCol = 0
    let endCol = 6
    for (let i = 0; i < 7; i++) {
      if (weekDates[i] && weekDates[i]! >= planStart) { startCol = i; break }
    }
    for (let i = 6; i >= 0; i--) {
      if (weekDates[i] && weekDates[i]! <= planEnd) { endCol = i; break }
    }
    bars.push({ plan, startCol, endCol })
  }
  return bars
}

export default function MonthGrid({
  year, month, selectedDate, plans, onSelectDate, onPrevMonth, onNextMonth,
}: Props) {
  const today = new Date().toISOString().split('T')[0]
  const weeks = getWeeks(year, month)
  const months = i18n.t('months') as unknown as string[]
  const daysShort = i18n.t('days_short') as unknown as string[]

  return (
    <View style={s.container}>
      <View style={s.nav}>
        <TouchableOpacity onPress={onPrevMonth} style={s.navBtn}>
          <Text style={s.navArrow}>‹</Text>
        </TouchableOpacity>
        <Text style={s.monthTitle}>{months[month]} {year}</Text>
        <TouchableOpacity onPress={onNextMonth} style={s.navBtn}>
          <Text style={s.navArrow}>›</Text>
        </TouchableOpacity>
      </View>

      <View style={s.daysRow}>
        {daysShort.map(d => (
          <Text key={d} style={s.dayLabel}>{d}</Text>
        ))}
      </View>

      {weeks.map((week, wi) => {
        const bars = getBarsForWeek(week, year, month, plans)
        return (
          <View key={wi}>
            {/* Day numbers row */}
            <View style={s.weekRow}>
              {week.map((day, di) => {
                if (!day) return <View key={`e-${di}`} style={s.cell} />
                const iso = toISO(year, month, day)
                const isToday = iso === today
                const isSelected = iso === selectedDate
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
                  </TouchableOpacity>
                )
              })}
            </View>

            {/* Event bars */}
            {bars.map(({ plan, startCol, endCol }, bi) => {
              const barColor = plan.color ?? colors.primary
              const barWidth = (endCol - startCol + 1) * CELL_WIDTH - spacing.xs
              const barLeft = startCol * CELL_WIDTH + spacing.xs / 2
              return (
                <TouchableOpacity
                  key={`${plan.id}-${bi}`}
                  style={[s.eventBar, {
                    backgroundColor: barColor,
                    width: barWidth,
                    marginLeft: barLeft,
                  }]}
                  onPress={() => onSelectDate(plan.start_date)}
                >
                  <Text style={s.eventBarText} numberOfLines={1}>{plan.title}</Text>
                </TouchableOpacity>
              )
            })}

            {bars.length > 0 && <View style={{ height: spacing.xs }} />}
          </View>
        )
      })}
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
  dayLabel: { width: CELL_WIDTH, textAlign: 'center', color: colors.textDim, ...font.small },
  weekRow: { flexDirection: 'row' },
  cell: { width: CELL_WIDTH, alignItems: 'center', paddingVertical: spacing.xs },
  dayCircle: {
    width: 30, height: 30, borderRadius: 15,
    justifyContent: 'center', alignItems: 'center',
  },
  selectedCircle: { backgroundColor: colors.primary },
  todayCircle: { borderWidth: 1, borderColor: colors.primary },
  dayText: { color: colors.white, ...font.label },
  selectedText: { color: colors.white, fontWeight: '700' },
  todayText: { color: colors.primary },
  eventBar: {
    height: 18, borderRadius: radii.sm,
    justifyContent: 'center', paddingHorizontal: spacing.xs,
    marginBottom: 2,
  },
  eventBarText: { color: colors.white, fontSize: 10, fontWeight: '600' },
})
