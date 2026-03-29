import { Dimensions, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native'
import i18n from '../../lib/i18n'
import { getEventHeight, getEventTop, tzLabel } from '../../lib/calendarUtils'
import { colors, font, radii, spacing } from '../../lib/theme'
import { Plan } from '../../types'

const { width: SCREEN_WIDTH } = Dimensions.get('window')
const TIME_COL_WIDTH = 44
const DAY_COL_WIDTH = SCREEN_WIDTH - spacing.md * 2 - TIME_COL_WIDTH
const ROW_HEIGHT = 64
const START_HOUR = 6
const END_HOUR = 24
const HOURS = Array.from({ length: END_HOUR - START_HOUR }, (_, i) => i + START_HOUR)

type Props = {
  date: string
  plans: Plan[]
  onPrev: () => void
  onNext: () => void
}

function formatFullDate(iso: string) {
  return new Date(iso + 'T12:00:00').toLocaleDateString(i18n.locale, {
    weekday: 'long', day: 'numeric', month: 'long', year: 'numeric',
  })
}

export default function DayView({ date, plans, onPrev, onNext }: Props) {
  const dayPlans = plans.filter(p => {
    const end = p.end_date ?? p.start_date
    return date >= p.start_date && date <= end
  })

  const allDayPlans = dayPlans.filter(p => p.all_day !== false || !p.start_time)
  const timedPlans = dayPlans.filter(p => p.all_day === false && !!p.start_time)

  return (
    <View style={s.container}>
      {/* Nav */}
      <View style={s.nav}>
        <TouchableOpacity onPress={onPrev} style={s.navBtn}>
          <Text style={s.navArrow}>‹</Text>
        </TouchableOpacity>
        <Text style={s.dateTitle} numberOfLines={1}>{formatFullDate(date)}</Text>
        <TouchableOpacity onPress={onNext} style={s.navBtn}>
          <Text style={s.navArrow}>›</Text>
        </TouchableOpacity>
      </View>

      {/* All-day plans */}
      {allDayPlans.length > 0 && (
        <View style={s.allDaySection}>
          <View style={s.allDayLabelBox}>
            <Text style={s.allDayLabel}>{i18n.t('calendar.all_day')}</Text>
          </View>
          <View style={s.allDayList}>
            {allDayPlans.map(p => (
              <View key={p.id} style={[s.allDayCard, { borderLeftColor: p.color ?? colors.primary }]}>
                <Text style={s.allDayTitle}>{p.title}</Text>
                {p.location ? <Text style={s.allDayLocation}>📍 {p.location}</Text> : null}
              </View>
            ))}
          </View>
        </View>
      )}

      <View style={s.divider} />

      {/* Time grid */}
      <ScrollView showsVerticalScrollIndicator={false}>
        <View style={s.grid}>
          {/* Time labels */}
          <View style={{ width: TIME_COL_WIDTH }}>
            {HOURS.map(h => (
              <View key={h} style={s.timeRow}>
                <Text style={s.timeLabel}>{String(h).padStart(2, '0')}:00</Text>
              </View>
            ))}
          </View>

          {/* Day column */}
          <View style={[s.dayCol, { height: HOURS.length * ROW_HEIGHT }]}>
            {/* Hour lines */}
            {HOURS.map((_, hi) => (
              <View key={hi} style={[s.hourLine, { top: hi * ROW_HEIGHT }]} />
            ))}

            {/* No timed plans message */}
            {timedPlans.length === 0 && (
              <View style={s.emptyGrid}>
                <Text style={s.emptyText}>{i18n.t('calendar.no_timed_plans')}</Text>
              </View>
            )}

            {/* Timed events */}
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
                    {p.start_time}{p.end_time ? ` → ${p.end_time}` : ''}
                    {p.timezone ? ` · ${tzLabel(p.timezone)}` : ''}
                  </Text>
                ) : null}
                {p.location ? <Text style={s.eventLocation} numberOfLines={1}>📍 {p.location}</Text> : null}
                {p.profiles?.username ? <Text style={s.eventAuthor}>@{p.profiles.username}</Text> : null}
              </View>
            ))}
          </View>
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
  dateTitle: {
    color: colors.white, ...font.label,
    flex: 1, textAlign: 'center', textTransform: 'capitalize',
  },

  allDaySection: {
    flexDirection: 'row', paddingBottom: spacing.sm,
  },
  allDayLabelBox: { width: TIME_COL_WIDTH, paddingTop: 4 },
  allDayLabel: { color: colors.textDim, ...font.micro, textAlign: 'right', paddingRight: spacing.xs },
  allDayList: { flex: 1, gap: spacing.xs },
  allDayCard: {
    backgroundColor: colors.card, borderRadius: radii.sm,
    padding: spacing.sm, borderLeftWidth: 3,
  },
  allDayTitle: { color: colors.white, ...font.label },
  allDayLocation: { color: colors.primary, ...font.small, marginTop: 2 },

  divider: { height: 1, backgroundColor: colors.border, marginBottom: 0 },

  grid: { flexDirection: 'row' },

  timeRow: {
    height: ROW_HEIGHT,
    justifyContent: 'flex-start',
    paddingTop: 4,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.border,
  },
  timeLabel: { color: colors.textDim, ...font.tiny, textAlign: 'right', paddingRight: spacing.xs },

  dayCol: {
    width: DAY_COL_WIDTH,
    position: 'relative',
    borderLeftWidth: StyleSheet.hairlineWidth,
    borderLeftColor: colors.border,
  },
  hourLine: {
    position: 'absolute',
    left: 0, right: 0,
    height: StyleSheet.hairlineWidth,
    backgroundColor: colors.border,
  },

  emptyGrid: {
    position: 'absolute',
    top: ROW_HEIGHT * 2,
    left: 0, right: 0,
    alignItems: 'center',
  },
  emptyText: { color: colors.textDim, ...font.small },

  event: {
    position: 'absolute',
    left: spacing.xs,
    right: spacing.xs,
    borderRadius: radii.md,
    padding: spacing.sm,
    overflow: 'hidden',
  },
  eventTitle: { color: colors.white, ...font.label },
  eventTime: { color: 'rgba(255,255,255,0.8)', ...font.small, marginTop: 2 },
  eventLocation: { color: 'rgba(255,255,255,0.7)', ...font.small, marginTop: 2 },
  eventAuthor: { color: 'rgba(255,255,255,0.6)', ...font.tiny, marginTop: spacing.xs },
})
