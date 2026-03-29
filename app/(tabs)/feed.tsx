import { useFocusEffect } from 'expo-router'
import { useCallback, useEffect, useState } from 'react'
import { ActivityIndicator, FlatList, StyleSheet, Text, TouchableOpacity, View } from 'react-native'
import FilterBar, { DEFAULT_FILTERS, PlanFilters } from '../../components/shared/FilterBar'
import SearchBar from '../../components/shared/SearchBar'
import CreatePlanModal from '../../components/feed/CreatePlanModal'
import PlanCard from '../../components/feed/PlanCard'
import i18n from '../../lib/i18n'
import { filterPlans } from '../../lib/filterPlans'
import { supabase } from '../../lib/supabase'
import { colors, font, radii, spacing } from '../../lib/theme'
import { Plan } from '../../types'

export default function Feed() {
  const [plans, setPlans] = useState<Plan[]>([])
  const [filters, setFilters] = useState<PlanFilters>(DEFAULT_FILTERS)
  const [searchQuery, setSearchQuery] = useState('')
  const [loading, setLoading] = useState(true)
  const [modalVisible, setModalVisible] = useState(false)
  const [editingPlan, setEditingPlan] = useState<Plan | null>(null)
  const [userId, setUserId] = useState<string | null>(null)

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (user) setUserId(user.id)
    })
  }, [])

  useFocusEffect(useCallback(() => {
    fetchPlans()
  }, []))

  async function fetchPlans() {
    setLoading(true)
    const { data, error } = await supabase
      .from('plans')
      .select('*, profiles (id, username, full_name, avatar_url), plan_participants (user_id)')
      .order('created_at', { ascending: false })

    if (!error) setPlans(data || [])
    setLoading(false)
  }

  async function handleJoin(planId: string) {
    if (!userId) return
    const alreadyJoined = plans
      .find((p: any) => p.id === planId)
      ?.plan_participants?.some((pp: any) => pp.user_id === userId)

    if (alreadyJoined) {
      await supabase.from('plan_participants').delete().match({ plan_id: planId, user_id: userId })
    } else {
      await supabase.from('plan_participants').insert({ plan_id: planId, user_id: userId })
    }
    fetchPlans()
  }

  return (
    <View style={s.container}>
      <View style={s.header}>
        <Text style={s.logo}>{i18n.t('feed.title')}</Text>
        <TouchableOpacity style={s.newButton} onPress={() => { setEditingPlan(null); setModalVisible(true) }}>
          <Text style={s.newButtonText}>{i18n.t('feed.new_plan')}</Text>
        </TouchableOpacity>
      </View>

      <SearchBar value={searchQuery} onChange={setSearchQuery} />
      <FilterBar filters={filters} onChange={setFilters} />

      {loading ? (
        <ActivityIndicator color={colors.primary} style={{ marginTop: spacing.xxl }} />
      ) : filterPlans(plans, filters, userId, searchQuery).length === 0 ? (
        <View style={s.empty}>
          <Text style={s.emptyText}>{i18n.t('feed.no_plans')}</Text>
          <Text style={s.emptySubtext}>{i18n.t('feed.create_first')}</Text>
        </View>
      ) : (
        <FlatList
          data={filterPlans(plans, filters, userId, searchQuery)}
          keyExtractor={(item: any) => item.id}
          contentContainerStyle={{ paddingBottom: spacing.md }}
          renderItem={({ item }) => (
            <PlanCard
              plan={item}
              currentUserId={userId}
              onJoin={() => handleJoin(item.id)}
              onEdit={item.user_id === userId ? () => { setEditingPlan(item); setModalVisible(true) } : undefined}
            />
          )}
        />
      )}

      <CreatePlanModal
        visible={modalVisible}
        plan={editingPlan ?? undefined}
        onClose={() => { setModalVisible(false); setEditingPlan(null) }}
        onCreated={() => { setModalVisible(false); setEditingPlan(null); fetchPlans() }}
        onDeleted={() => { setModalVisible(false); setEditingPlan(null); fetchPlans() }}
        userId={userId}
      />
    </View>
  )
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg },
  header: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingHorizontal: spacing.md, paddingTop: 60, paddingBottom: spacing.md,
  },
  logo: { color: colors.white, ...font.logo },
  newButton: {
    backgroundColor: colors.primary,
    borderRadius: radii.pill,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
  },
  newButtonText: { color: colors.white, ...font.buttonSm },
  empty: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  emptyText: { color: colors.white, ...font.heading },
  emptySubtext: { color: colors.textDim, ...font.label, marginTop: spacing.sm },
})
