import { useFocusEffect } from 'expo-router'
import { useCallback, useEffect, useState } from 'react'
import { ActivityIndicator, FlatList, StyleSheet, Text, TouchableOpacity, View } from 'react-native'
import FilterBar, { DEFAULT_FILTERS, PlanFilters } from '../../components/shared/FilterBar'
import SearchBar from '../../components/shared/SearchBar'
import CreatePlanModal from '../../components/feed/CreatePlanModal'
import CreateGroupModal from '../../components/groups/CreateGroupModal'
import CreateMenu from '../../components/shared/CreateMenu'
import PlanCard from '../../components/feed/PlanCard'
import i18n from '../../lib/i18n'
import { filterPlans } from '../../lib/filterPlans'
import { supabase } from '../../lib/supabase'
import { colors, font, radii, spacing } from '../../lib/theme'
import { Group, Plan } from '../../types'

export default function Feed() {
  const [plans, setPlans] = useState<Plan[]>([])
  const [filters, setFilters] = useState<PlanFilters>(DEFAULT_FILTERS)
  const [searchQuery, setSearchQuery] = useState('')
  const [loading, setLoading] = useState(true)
  const [modalVisible, setModalVisible] = useState(false)
  const [editingPlan, setEditingPlan] = useState<Plan | null>(null)
  const [userId, setUserId] = useState<string | null>(null)
  const [menuVisible, setMenuVisible] = useState(false)
  const [groupModalVisible, setGroupModalVisible] = useState(false)
  const [userGroups, setUserGroups] = useState<Group[]>([])

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (user) {
        setUserId(user.id)
        fetchUserGroups(user.id)
      }
    })
  }, [])

  async function fetchUserGroups(uid: string) {
    const { data } = await supabase
      .from('group_members')
      .select('group_id, groups (id, owner_id, name, created_at)')
      .eq('user_id', uid)
    const groups = (data ?? []).map((row: any) => row.groups).filter(Boolean) as Group[]
    setUserGroups(groups)
  }

  useFocusEffect(useCallback(() => {
    fetchPlans()
  }, []))

  async function fetchPlans() {
    setLoading(true)
    const { data, error } = await supabase
      .from('plans')
      .select('*, profiles (id, username, full_name, avatar_url), plan_participants (user_id), plan_groups (group_id)')
      .order('created_at', { ascending: false })

    if (!error) setPlans(data || [])
    setLoading(false)
  }

  async function handleDelete(planId: string) {
    await supabase.from('plans').delete().eq('id', planId)
    fetchPlans()
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
        <TouchableOpacity style={s.newButton} onPress={() => setMenuVisible(true)}>
          <Text style={s.newButtonText}>{i18n.t('feed.create_button')}</Text>
        </TouchableOpacity>
      </View>

      <SearchBar value={searchQuery} onChange={setSearchQuery} />
      <FilterBar filters={filters} onChange={setFilters} groups={userGroups} />

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
              onDelete={item.user_id === userId ? () => handleDelete(item.id) : undefined}
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
        userGroups={userGroups}
      />

      <CreateGroupModal
        visible={groupModalVisible}
        onClose={() => setGroupModalVisible(false)}
        onCreated={() => { setGroupModalVisible(false); fetchUserGroups(userId!) }}
        userId={userId}
      />

      <CreateMenu
        visible={menuVisible}
        onClose={() => setMenuVisible(false)}
        onSelectPiano={() => { setEditingPlan(null); setModalVisible(true) }}
        onSelectGruppo={() => setGroupModalVisible(true)}
        onSelectChat={() => setGroupModalVisible(true)}
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
