import { useEffect, useState } from 'react'
import { ActivityIndicator, FlatList, StyleSheet, Text, TouchableOpacity, View } from 'react-native'
import CreatePlanModal from '../../components/feed/CreatePlanModal'
import PlanCard from '../../components/feed/PlanCard'
import { supabase } from '../../lib/supabase'
import { colors, font, radii, spacing } from '../../lib/theme'

export default function Feed() {
  const [plans, setPlans] = useState([])
  const [loading, setLoading] = useState(true)
  const [modalVisible, setModalVisible] = useState(false)
  const [userId, setUserId] = useState(null)

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (user) setUserId(user.id)
    })
    fetchPlans()
  }, [])

  async function fetchPlans() {
    setLoading(true)
    const { data, error } = await supabase
      .from('plans')
      .select('*, profiles (id, username, full_name), plan_participants (user_id)')
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
        <Text style={s.logo}>spotly</Text>
        <TouchableOpacity style={s.newButton} onPress={() => setModalVisible(true)}>
          <Text style={s.newButtonText}>+ Piano</Text>
        </TouchableOpacity>
      </View>

      {loading ? (
        <ActivityIndicator color={colors.primary} style={{ marginTop: spacing.xxl }} />
      ) : plans.length === 0 ? (
        <View style={s.empty}>
          <Text style={s.emptyText}>Nessun piano ancora.</Text>
          <Text style={s.emptySubtext}>Crea il primo!</Text>
        </View>
      ) : (
        <FlatList
          data={plans}
          keyExtractor={(item: any) => item.id}
          contentContainerStyle={{ paddingBottom: spacing.md }}
          renderItem={({ item }) => (
            <PlanCard plan={item} currentUserId={userId} onJoin={() => handleJoin(item.id)} />
          )}
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
