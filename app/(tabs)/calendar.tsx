import { useEffect, useState } from 'react'
import { FlatList, ScrollView, StyleSheet, Text, View } from 'react-native'
import MonthGrid from '../../components/calendar/MonthGrid'
import PlanCard from '../../components/feed/PlanCard'
import { supabase } from '../../lib/supabase'
import { colors, font, spacing } from '../../lib/theme'
import { Plan } from '../../types'

export default function CalendarScreen() {
  const today = new Date()
  const [year, setYear] = useState(today.getFullYear())
  const [month, setMonth] = useState(today.getMonth())
  const [selectedDate, setSelectedDate] = useState<string>(today.toISOString().split('T')[0])
  const [plans, setPlans] = useState<Plan[]>([])
  const [userId, setUserId] = useState<string | null>(null)

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (user) setUserId(user.id)
    })
    fetchPlans()
  }, [])

  async function fetchPlans() {
    const { data } = await supabase
      .from('plans')
      .select('*, profiles (id, username, full_name), plan_participants (user_id)')
      .order('start_date', { ascending: true })
    setPlans((data as Plan[]) || [])
  }

  async function handleJoin(planId: string) {
    if (!userId) return
    const plan = plans.find(p => p.id === planId)
    const alreadyJoined = plan?.plan_participants?.some(pp => pp.user_id === userId)
    if (alreadyJoined) {
      await supabase.from('plan_participants').delete().match({ plan_id: planId, user_id: userId })
    } else {
      await supabase.from('plan_participants').insert({ plan_id: planId, user_id: userId })
    }
    fetchPlans()
  }

  function prevMonth() {
    if (month === 0) { setMonth(11); setYear(y => y - 1) }
    else setMonth(m => m - 1)
  }

  function nextMonth() {
    if (month === 11) { setMonth(0); setYear(y => y + 1) }
    else setMonth(m => m + 1)
  }

  // Dates that have at least one plan (for dots on calendar)
  const datesWithPlans = new Set(plans.map(p => p.start_date))

  // Plans for the selected day
  const selectedPlans = plans.filter(p => {
    const start = p.start_date
    const end = p.end_date ?? p.start_date
    return selectedDate >= start && selectedDate <= end
  })

  return (
    <ScrollView style={s.container} showsVerticalScrollIndicator={false}>
      <Text style={s.header}>calendario</Text>

      <MonthGrid
        year={year}
        month={month}
        selectedDate={selectedDate}
        datesWithPlans={datesWithPlans}
        onSelectDate={setSelectedDate}
        onPrevMonth={prevMonth}
        onNextMonth={nextMonth}
      />

      <View style={s.divider} />

      <Text style={s.sectionTitle}>
        {new Date(selectedDate).toLocaleDateString('it-IT', {
          weekday: 'long', day: 'numeric', month: 'long',
        })}
      </Text>

      {selectedPlans.length === 0 ? (
        <View style={s.empty}>
          <Text style={s.emptyText}>Nessun piano per questo giorno.</Text>
        </View>
      ) : (
        selectedPlans.map(plan => (
          <PlanCard
            key={plan.id}
            plan={plan}
            currentUserId={userId}
            onJoin={() => handleJoin(plan.id)}
          />
        ))
      )}

      <View style={{ height: spacing.xxl }} />
    </ScrollView>
  )
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg },
  header: {
    color: colors.white, ...font.logo,
    paddingHorizontal: spacing.md,
    paddingTop: 60,
    paddingBottom: spacing.sm,
  },
  divider: {
    height: 1, backgroundColor: colors.border,
    marginHorizontal: spacing.md, marginVertical: spacing.md,
  },
  sectionTitle: {
    color: colors.textMuted, ...font.label,
    paddingHorizontal: spacing.md,
    marginBottom: spacing.xs,
    textTransform: 'capitalize',
  },
  empty: { paddingHorizontal: spacing.md, paddingTop: spacing.md },
  emptyText: { color: colors.textDim, ...font.label },
})
