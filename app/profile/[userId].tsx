import { Ionicons } from '@expo/vector-icons'
import { useLocalSearchParams, useRouter } from 'expo-router'
import { useEffect, useState } from 'react'
import {
  ActivityIndicator, FlatList, Image, StyleSheet,
  Text, TouchableOpacity, View,
} from 'react-native'
import PlanCard from '../../components/feed/PlanCard'
import i18n from '../../lib/i18n'
import { supabase } from '../../lib/supabase'
import { colors, font, radii, spacing } from '../../lib/theme'
import { Plan, Profile, ReachStatus } from '../../types'

export default function UserProfileScreen() {
  const { userId } = useLocalSearchParams<{ userId: string }>()
  const router = useRouter()

  const [profile, setProfile] = useState<Profile | null>(null)
  const [plans, setPlans] = useState<Plan[]>([])
  const [reachStatus, setReachStatus] = useState<ReachStatus | null>(null)
  const [reacherCount, setReacherCount] = useState(0)
  const [currentUserId, setCurrentUserId] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (user) {
        setCurrentUserId(user.id)
        fetchAll(user.id)
      }
    })
  }, [userId])

  async function fetchAll(uid: string) {
    setLoading(true)
    await Promise.all([fetchProfile(), fetchReachStatus(uid), fetchReacherCount()])
    setLoading(false)
  }

  async function fetchProfile() {
    const { data } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single()
    setProfile(data)
    if (data && !data.is_private) fetchPlans()
  }

  async function fetchReachStatus(uid: string) {
    const { data } = await supabase
      .from('reaches')
      .select('status')
      .eq('reacher_id', uid)
      .eq('reached_id', userId)
      .maybeSingle()
    setReachStatus(data?.status ?? null)
  }

  async function fetchReacherCount() {
    const { count } = await supabase
      .from('reaches')
      .select('*', { count: 'exact', head: true })
      .eq('reached_id', userId)
      .eq('status', 'accepted')
    setReacherCount(count ?? 0)
  }

  async function fetchPlans() {
    const { data } = await supabase
      .from('plans')
      .select('*, profiles (id, username, full_name, avatar_url), plan_participants (user_id)')
      .eq('user_id', userId)
      .in('visibility', ['public', 'friends'])
      .order('start_date', { ascending: true })
    setPlans((data as Plan[]) ?? [])
  }

  async function handleReach() {
    if (!currentUserId || !profile) return
    if (reachStatus === 'accepted' || reachStatus === 'pending') {
      await supabase.from('reaches').delete().match({ reacher_id: currentUserId, reached_id: userId })
      setReachStatus(null)
      setReacherCount(c => Math.max(0, c - (reachStatus === 'accepted' ? 1 : 0)))
    } else {
      const status: ReachStatus = profile.is_private ? 'pending' : 'accepted'
      await supabase.from('reaches').insert({ reacher_id: currentUserId, reached_id: userId, status })
      setReachStatus(status)
      if (status === 'accepted') {
        setReacherCount(c => c + 1)
        fetchPlans()
      }
    }
  }

  if (loading) {
    return (
      <View style={s.loader}>
        <ActivityIndicator color={colors.primary} />
      </View>
    )
  }

  if (!profile) return null

  const initial = (profile.username ?? '?')[0].toUpperCase()
  const isReaching = reachStatus === 'accepted'
  const isPending = reachStatus === 'pending'
  const canSeePlans = !profile.is_private || isReaching

  return (
    <View style={s.container}>
      <FlatList
        data={canSeePlans ? plans : []}
        keyExtractor={item => item.id}
        ListHeaderComponent={
          <View>
            <View style={s.header}>
              <TouchableOpacity onPress={() => router.back()} style={s.backBtn}>
                <Ionicons name="arrow-back" size={24} color={colors.white} />
              </TouchableOpacity>
            </View>

            <View style={s.profileSection}>
              {profile.avatar_url ? (
                <Image source={{ uri: profile.avatar_url }} style={s.avatar} />
              ) : (
                <View style={s.avatarPlaceholder}>
                  <Text style={s.avatarText}>{initial}</Text>
                </View>
              )}
              <View style={s.info}>
                <View style={s.nameRow}>
                  <Text style={s.username}>@{profile.username}</Text>
                  {profile.is_private && (
                    <Ionicons name="lock-closed" size={14} color={colors.textDim} style={{ marginLeft: spacing.xs }} />
                  )}
                </View>
                {profile.full_name ? <Text style={s.fullName}>{profile.full_name}</Text> : null}
                {profile.bio ? <Text style={s.bio}>{profile.bio}</Text> : null}
                <Text style={s.reacherCount}>
                  {i18n.t('explore.reachers', { count: reacherCount })}
                </Text>
              </View>
            </View>

            {currentUserId !== userId && (
              <TouchableOpacity
                style={[s.reachBtn, isReaching && s.reachBtnActive, isPending && s.reachBtnPending]}
                onPress={handleReach}
              >
                <Text style={[s.reachBtnText, (isReaching || isPending) && s.reachBtnTextActive]}>
                  {isReaching ? i18n.t('reach.reaching') : isPending ? i18n.t('reach.requested') : i18n.t('reach.reach')}
                </Text>
              </TouchableOpacity>
            )}

            <View style={s.divider} />

            {!canSeePlans ? (
              <View style={s.privateBox}>
                <Ionicons name="lock-closed" size={28} color={colors.textDim} />
                <Text style={s.privateTitle}>{i18n.t('user_profile.private_account')}</Text>
                <Text style={s.privateBody}>{i18n.t('user_profile.private_body')}</Text>
              </View>
            ) : (
              <Text style={s.sectionTitle}>{i18n.t('user_profile.plans', { count: plans.length })}</Text>
            )}
          </View>
        }
        ListEmptyComponent={
          canSeePlans ? <Text style={s.empty}>{i18n.t('user_profile.no_plans')}</Text> : null
        }
        renderItem={({ item }) => (
          <PlanCard
            plan={item}
            currentUserId={currentUserId}
          />
        )}
        contentContainerStyle={{ paddingBottom: spacing.xxl }}
        showsVerticalScrollIndicator={false}
      />
    </View>
  )
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg },
  loader: { flex: 1, backgroundColor: colors.bg, justifyContent: 'center', alignItems: 'center' },
  header: {
    paddingTop: 60, paddingHorizontal: spacing.md, paddingBottom: spacing.sm,
  },
  backBtn: { padding: spacing.xs },
  profileSection: {
    flexDirection: 'row', alignItems: 'flex-start',
    paddingHorizontal: spacing.md, gap: spacing.md, marginBottom: spacing.md,
  },
  avatar: { width: 72, height: 72, borderRadius: 36 },
  avatarPlaceholder: {
    width: 72, height: 72, borderRadius: 36,
    backgroundColor: colors.primary,
    justifyContent: 'center', alignItems: 'center',
  },
  avatarText: { color: colors.white, fontSize: 28, fontWeight: '700' },
  info: { flex: 1 },
  nameRow: { flexDirection: 'row', alignItems: 'center' },
  username: { color: colors.white, ...font.heading },
  fullName: { color: colors.textMuted, ...font.body, marginTop: 2 },
  bio: { color: colors.textDim, ...font.small, marginTop: 4 },
  reacherCount: { color: colors.textDim, ...font.small, marginTop: spacing.xs },
  reachBtn: {
    marginHorizontal: spacing.md, borderRadius: radii.md,
    borderWidth: 1, borderColor: colors.primary,
    padding: spacing.sm + 2, alignItems: 'center',
    marginBottom: spacing.md,
  },
  reachBtnActive: { backgroundColor: colors.primaryDim },
  reachBtnPending: { borderColor: colors.textDim },
  reachBtnText: { color: colors.primary, ...font.button },
  reachBtnTextActive: { color: colors.textMuted },
  divider: { height: 1, backgroundColor: colors.border, marginHorizontal: spacing.md, marginBottom: spacing.md },
  sectionTitle: { color: colors.textMuted, ...font.label, paddingHorizontal: spacing.md, marginBottom: spacing.xs },
  privateBox: { alignItems: 'center', paddingVertical: spacing.xxl, paddingHorizontal: spacing.xl, gap: spacing.sm },
  privateTitle: { color: colors.white, ...font.heading },
  privateBody: { color: colors.textDim, ...font.body, textAlign: 'center' },
  empty: { color: colors.textDim, ...font.body, paddingHorizontal: spacing.md, paddingTop: spacing.md },
})
