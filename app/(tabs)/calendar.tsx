import { useEffect, useState } from 'react'
import { ActivityIndicator, StyleSheet, Text, TouchableOpacity, View } from 'react-native'
import DayView from '../../components/calendar/DayView'
import MonthGrid from '../../components/calendar/MonthGrid'
import WeekView from '../../components/calendar/WeekView'
import CreatePlanModal from '../../components/feed/CreatePlanModal'
import i18n from '../../lib/i18n'
import { addDays } from '../../lib/calendarUtils'
import { supabase } from '../../lib/supabase'
import { colors, font, radii, spacing } from '../../lib/theme'
import { Plan } from '../../types'

type ViewMode = 'month' | 'week' | 'day'

function getMondayOfWeek(date: Date): Date {
  const d = new Date(date)
  const day = d.getDay()
  const diff = (day + 6) % 7
  d.setDate(d.getDate() - diff)
  d.setHours(0, 0, 0, 0)
  return d
}


export default function CalendarScreen() {
  const today = new Date()
  const todayISO = today.toISOString().split('T')[0]

  const [view, setView] = useState<ViewMode>('month')
  const [year, setYear] = useState(today.getFullYear())
  const [month, setMonth] = useState(today.getMonth())
  const [selectedDate, setSelectedDate] = useState(todayISO)
  const [weekStart, setWeekStart] = useState(getMondayOfWeek(today))
  const [plans, setPlans] = useState<Plan[]>([])
  const [loading, setLoading] = useState(true)
  const [modalVisible, setModalVisible] = useState(false)
  const [userId, setUserId] = useState<string | null>(null)

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (user) setUserId(user.id)
    })
    fetchPlans()
  }, [])

  async function fetchPlans() {
    setLoading(true)
    const { data } = await supabase
      .from('plans')
      .select('*, profiles (id, username, full_name, avatar_url), plan_participants (user_id)')
      .order('start_date', { ascending: true })
    setPlans((data as Plan[]) || [])
    setLoading(false)
  }

  function prevMonth() {
    if (month === 0) { setMonth(11); setYear(y => y - 1) }
    else setMonth(m => m - 1)
  }
  function nextMonth() {
    if (month === 11) { setMonth(0); setYear(y => y + 1) }
    else setMonth(m => m + 1)
  }
  function prevWeek() { setWeekStart(w => addDays(w, -7)) }
  function nextWeek() { setWeekStart(w => addDays(w, 7)) }
  function shiftDay(iso: string, delta: number): string {
    const [y, m, d] = iso.split('-').map(Number)
    const date = new Date(y, m - 1, d + delta)
    return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`
  }
  function prevDay() { setSelectedDate(d => shiftDay(d, -1)) }
  function nextDay() { setSelectedDate(d => shiftDay(d, 1)) }

  const VIEW_OPTIONS: { key: ViewMode; label: string }[] = [
    { key: 'month', label: i18n.t('calendar.month') },
    { key: 'week', label: i18n.t('calendar.week') },
    { key: 'day', label: i18n.t('calendar.day') },
  ]

  return (
    <View style={s.container}>
      <View style={s.header}>
        <Text style={s.headerTitle}>{i18n.t('calendar.title')}</Text>
        <TouchableOpacity style={s.newButton} onPress={() => setModalVisible(true)}>
          <Text style={s.newButtonText}>{i18n.t('feed.new_plan')}</Text>
        </TouchableOpacity>
      </View>

      {/* View switcher */}
      <View style={s.switcher}>
        {VIEW_OPTIONS.map(opt => (
          <TouchableOpacity
            key={opt.key}
            style={[s.switchBtn, view === opt.key && s.switchBtnActive]}
            onPress={() => setView(opt.key)}
          >
            <Text style={[s.switchLabel, view === opt.key && s.switchLabelActive]}>
              {opt.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {loading ? (
        <ActivityIndicator color={colors.primary} style={{ marginTop: spacing.xxl }} />
      ) : view === 'month' ? (
        <MonthGrid
          year={year}
          month={month}
          selectedDate={selectedDate}
          plans={plans}
          onSelectDate={setSelectedDate}
          onPrevMonth={prevMonth}
          onNextMonth={nextMonth}
        />
      ) : view === 'week' ? (
        <WeekView
          weekStart={weekStart}
          plans={plans}
          selectedDate={selectedDate}
          onSelectDate={date => { setSelectedDate(date); setWeekStart(getMondayOfWeek(new Date(date))) }}
          onPrev={prevWeek}
          onNext={nextWeek}
        />
      ) : (
        <DayView
          date={selectedDate}
          plans={plans}
          onPrev={prevDay}
          onNext={nextDay}
        />
      )}

      <CreatePlanModal
        visible={modalVisible}
        onClose={() => setModalVisible(false)}
        onCreated={() => { setModalVisible(false); fetchPlans() }}
        userId={userId}
      />
    </View>
  )
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg },
  header: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingHorizontal: spacing.md, paddingTop: 60, paddingBottom: spacing.sm,
  },
  headerTitle: { color: colors.white, ...font.logo },
  newButton: {
    backgroundColor: colors.primary, borderRadius: radii.pill,
    paddingHorizontal: spacing.md, paddingVertical: spacing.sm,
  },
  newButtonText: { color: colors.white, ...font.buttonSm },
  switcher: {
    flexDirection: 'row', marginHorizontal: spacing.md,
    backgroundColor: colors.card, borderRadius: radii.md,
    padding: 3, marginBottom: spacing.sm,
  },
  switchBtn: {
    flex: 1, paddingVertical: spacing.sm, alignItems: 'center', borderRadius: radii.sm,
  },
  switchBtnActive: { backgroundColor: colors.primary },
  switchLabel: { color: colors.textDim, ...font.small },
  switchLabelActive: { color: colors.white, fontWeight: '700' },
})
