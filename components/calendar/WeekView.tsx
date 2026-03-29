import { Dimensions, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native'
import i18n from '../../lib/i18n'
import { addDays, getEventHeight, getEventTop, tzLabel } from '../../lib/calendarUtils'
import { colors, font, radii, spacing } from '../../lib/theme'
import { Plan } from '../../types'

const { width: SCREEN_WIDTH } = Dimensions.get('window')
const TIME_COL_WIDTH = 44
const COL_WIDTH = (SCREEN_WIDTH - spacing.md * 2 - TIME_COL_WIDTH) / 7
const ROW_HEIGHT = 56
const START_HOUR = 6
const END_HOUR = 24
const HOURS = Array.from({ length: END_HOUR - START_HOUR }, (_, i) => i + START_HOUR)

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

export default function WeekView({ weekStart, plans, selectedDate, onSelectDate, onPrev, onNext }: Props) {
  const today = new Date().toISOString().split('T')[0]
  const days = Array.from({ length: 7 }, (_, i) => addDays(weekStart, i))
  const daysShort = i18n.t('days_short') as unknown as string[]

  const startISO = toISO(weekStart)
  const endISO = toISO(addDays(weekStart, 6))

  const weekPlans = plans.filter(p => {
    const end = p.end_date ?? p.start_date
    return end >= startISO && p.start_date <= endISO
  })

  function getPlansForDay(iso: string) {
    return weekPlans.filter(p => {
      const end = p.end_date ?? p.start_date
      return iso >= p.start_date && iso <= end
    })
  }

  const hasAllDay = weekPlans.some(p => p.all_day !== false || !p.start_time)

  return (
    <View style={s.container}>
      {/* Nav */}
      <View style={s.nav}>
        <TouchableOpacity onPress={onPrev} style={s.navBtn}>
          <Text style={s.navArrow}>‹</Text>
        </TouchableOpacity>
        <Text style={s.weekTitle}>
          {weekStart.toLocaleDateString(i18n.locale, { day: 'numeric', month: 'short' })} –{' '}
          {addDays(weekStart, 6).toLocaleDateString(i18n.locale, { day: 'numeric', month: 'short', year: 'numeric' })}
        </Text>
        <TouchableOpacity onPress={onNext} style={s.navBtn}>
          <Text style={s.navArrow}>›</Text>
        </TouchableOpacity>
      </View>

      {/* Day header */}
      <View style={s.headerRow}>
        <View style={{ width: TIME_COL_WIDTH }} />
        {days.map((day, i) => {
          const iso = toISO(day)
          const isToday = iso === today
          const isSelected = iso === selectedDate
          return (
            <TouchableOpacity key={iso} style={s.dayHeader} onPress={() => onSelectDate(iso)}>
              <Text style={[s.dayName, isToday && s.accent]}>{daysShort[i]}</Text>
              <View style={[s.dayCircle, isSelected && s.selectedCircle, isToday && !isSelected && s.todayCircle]}>
                <Text style={[s.dayNum, isSelected && s.selectedNum, isToday && !isSelected && s.accent]}>
                  {day.getDate()}
                </Text>
              </View>
            </TouchableOpacity>
          )
        })}
      </View>

      {/* All-day row */}
      {hasAllDay && (
        <View style={s.allDayRow}>
          <View style={s.allDayLabelBox}>
            <Text style={s.allDayLabelText}>{i18n.t('calendar.all_day')}</Text>
          </View>
          {days.map((day) => {
            const iso = toISO(day)
            const allDayPlans = getPlansForDay(iso).filter(p => p.all_day !== false || !p.start_time)
            return (
              <View key={iso} style={s.allDayCell}>
                {allDayPlans.slice(0, 2).map(p => (
                  <View key={p.id} style={[s.allDayPill, { backgroundColor: p.color ?? colors.primary }]}>
                    <Text style={s.allDayPillText} numberOfLines={1}>{p.title}</Text>
                  </View>
                ))}
                {allDayPlans.length > 2 && (
                  <Text style={s.moreText}>+{allDayPlans.length - 2}</Text>
                )}
              </View>
            )
          })}
        </View>
      )}

      <View style={s.divider} />

      {/* Scrollable time grid */}
      <ScrollView showsVerticalScrollIndicator={false}>
        <View style={s.grid}>
          {/* Time labels column */}
          <View style={{ width: TIME_COL_WIDTH }}>
            {HOURS.map(h => (
              <View key={h} style={s.timeRow}>
                <Text style={s.timeLabel}>{String(h).padStart(2, '0')}:00</Text>
              </View>
            ))}
          </View>

          {/* Day columns */}
          {days.map((day, di) => {
            const iso = toISO(day)
            const isSelected = iso === selectedDate
            const timedPlans = getPlansForDay(iso).filter(p => p.all_day === false && !!p.start_time)
            return (
              <TouchableOpacity
                key={iso}
                activeOpacity={0.7}
                onPress={() => onSelectDate(iso)}
                style={[
                  s.dayCol,
                  isSelected && s.dayColSelected,
                  di > 0 && s.dayColBorder,
                  { height: HOURS.length * ROW_HEIGHT },
                ]}
              >
                {/* Hour lines */}
                {HOURS.map((_, hi) => (
                  <View key={hi} style={[s.hourLine, { top: hi * ROW_HEIGHT }]} />
                ))}
                {/* Events */}
                {timedPlans.map(p => (
                  <View
                    key={p.id}
                    style={[s.event, {
                      backgroundColor: p.color ?? colors.primary,
                      top: getEventTop(p, START_HOUR, ROW_HEIGHT),
                      height: getEventHeight(p, START_HOUR, ROW_HEIGHT),
                    }]}
                  >
                    <Text style={s.eventTitle} numberOfLines={2}>{p.title}</Text>
                    {p.start_time ? (
                      <Text style={s.eventTime}>
                        {p.start_time}{p.timezone ? ` · ${tzLabel(p.timezone)}` : ''}
                      </Text>
                    ) : null}
                  </View>
                ))}
              </TouchableOpacity>
            )
          })}
        </View>
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
  navArrow: { color: colors.white, ...font.heading, fontWeight: '300' },
  weekTitle: { color: colors.white, ...font.label, textAlign: 'center', flex: 1 },

  headerRow: {
    flexDirection: 'row', alignItems: 'center',
    borderBottomWidth: 1, borderBottomColor: colors.border,
    paddingBottom: spacing.xs,
  },
  dayHeader: { width: COL_WIDTH, alignItems: 'center', gap: spacing.xs },
  dayName: { color: colors.textDim, ...font.tiny, fontWeight: '600', textTransform: 'uppercase' },
  dayCircle: { width: 28, height: 28, borderRadius: 14, justifyContent: 'center', alignItems: 'center' },
  selectedCircle: { backgroundColor: colors.primary },
  todayCircle: { borderWidth: 1, borderColor: colors.primary },
  dayNum: { color: colors.white, ...font.label },
  selectedNum: { color: colors.white, fontWeight: '700' },
  accent: { color: colors.primary },

  allDayRow: {
    flexDirection: 'row', minHeight: 28,
    paddingVertical: spacing.xs,
    borderBottomWidth: 1, borderBottomColor: colors.border,
  },
  allDayLabelBox: { width: TIME_COL_WIDTH, justifyContent: 'center' },
  allDayLabelText: { color: colors.textDim, ...font.micro, textAlign: 'right', paddingRight: spacing.xs },
  allDayCell: { width: COL_WIDTH, gap: 2 },
  allDayPill: {
    borderRadius: radii.sm, paddingHorizontal: 2, paddingVertical: 1,
  },
  allDayPillText: { color: colors.white, ...font.micro, fontWeight: '600' },
  moreText: { color: colors.textDim, ...font.micro },

  divider: { height: 1, backgroundColor: colors.border },

  grid: { flexDirection: 'row' },

  timeRow: {
    height: ROW_HEIGHT,
    justifyContent: 'flex-start',
    paddingTop: 2,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.border,
  },
  timeLabel: { color: colors.textDim, ...font.tiny, textAlign: 'right', paddingRight: spacing.xs },

  dayCol: {
    width: COL_WIDTH,
    position: 'relative',
    backgroundColor: 'transparent',
  },
  dayColSelected: { backgroundColor: 'rgba(108,99,255,0.05)' },
  dayColBorder: { borderLeftWidth: StyleSheet.hairlineWidth, borderLeftColor: colors.border },

  hourLine: {
    position: 'absolute',
    left: 0, right: 0,
    height: StyleSheet.hairlineWidth,
    backgroundColor: colors.border,
  },

  event: {
    position: 'absolute',
    left: 2, right: 2,
    borderRadius: radii.sm,
    padding: 3,
    overflow: 'hidden',
  },
  eventTitle: { color: colors.white, ...font.tiny, fontWeight: '600' },
  eventTime: { color: 'rgba(255,255,255,0.7)', ...font.micro },
})
