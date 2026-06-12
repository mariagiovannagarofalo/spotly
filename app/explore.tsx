import { Ionicons } from '@expo/vector-icons'
import { useRouter } from 'expo-router'
import { useEffect, useState } from 'react'
import {
  ActivityIndicator, FlatList, Image, StyleSheet,
  Text, TextInput, TouchableOpacity, View,
} from 'react-native'
import i18n from '../lib/i18n'
import { supabase } from '../lib/supabase'
import { colors, font, radii, spacing } from '../lib/theme'
import { Profile, ReachStatus } from '../types'

type UserWithReach = Profile & { reachStatus: ReachStatus | null }

export default function ExploreScreen() {
  const router = useRouter()
  const [query, setQuery] = useState('')
  const [userId, setUserId] = useState<string | null>(null)
  const [suggested, setSuggested] = useState<UserWithReach[]>([])
  const [results, setResults] = useState<UserWithReach[]>([])
  const [loading, setLoading] = useState(true)
  const [searching, setSearching] = useState(false)

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (user) {
        setUserId(user.id)
        fetchSuggested(user.id)
      }
    })
  }, [])

  useEffect(() => {
    if (!userId) return
    if (!query.trim()) {
      setResults([])
      return
    }
    const timer = setTimeout(() => searchUsers(query.trim()), 400)
    return () => clearTimeout(timer)
  }, [query, userId])

  async function fetchSuggested(uid: string) {
    setLoading(true)
    // Persone raggiunte da chi raggiungi (reach in comune)
    const { data: myReaches } = await supabase
      .from('reaches')
      .select('reached_id')
      .eq('reacher_id', uid)
      .eq('status', 'accepted')

    const myReachedIds = (myReaches ?? []).map((r: any) => r.reached_id)

    let candidates: Profile[] = []

    if (myReachedIds.length > 0) {
      const { data } = await supabase
        .from('reaches')
        .select('reached_id, profiles!reaches_reached_id_fkey(id, username, full_name, avatar_url, bio, is_private)')
        .in('reacher_id', myReachedIds)
        .eq('status', 'accepted')
        .neq('reached_id', uid)
      candidates = (data ?? [])
        .map((r: any) => r.profiles)
        .filter(Boolean)
        .filter((p: Profile) => !myReachedIds.includes(p.id))
    }

    if (candidates.length < 5) {
      const { data } = await supabase
        .from('profiles')
        .select('id, username, full_name, avatar_url, bio, is_private')
        .neq('id', uid)
        .limit(10)
      const extra = (data ?? []).filter(
        (p: Profile) => !myReachedIds.includes(p.id) && !candidates.find(c => c.id === p.id)
      )
      candidates = [...candidates, ...extra].slice(0, 8)
    }

    const uniqueById = Array.from(new Map(candidates.map(p => [p.id, p])).values())
    const withStatus = await attachReachStatus(uniqueById, uid)
    setSuggested(withStatus)
    setLoading(false)
  }

  async function searchUsers(q: string) {
    if (!userId) return
    setSearching(true)
    const { data } = await supabase
      .from('profiles')
      .select('id, username, full_name, avatar_url, bio, is_private')
      .or(`username.ilike.%${q}%,full_name.ilike.%${q}%`)
      .neq('id', userId)
      .limit(20)

    const withStatus = await attachReachStatus(data ?? [], userId)
    setResults(withStatus)
    setSearching(false)
  }

  async function attachReachStatus(profiles: Profile[], uid: string): Promise<UserWithReach[]> {
    if (profiles.length === 0) return []
    const ids = profiles.map(p => p.id)
    const { data } = await supabase
      .from('reaches')
      .select('reached_id, status')
      .eq('reacher_id', uid)
      .in('reached_id', ids)

    const statusMap = new Map((data ?? []).map((r: any) => [r.reached_id, r.status]))
    return profiles.map(p => ({ ...p, reachStatus: (statusMap.get(p.id) as ReachStatus) ?? null }))
  }

  async function handleReach(targetId: string, currentStatus: ReachStatus | null, isPrivate: boolean) {
    if (!userId) return
    if (currentStatus === 'accepted' || currentStatus === 'pending') {
      await supabase.from('reaches').delete().match({ reacher_id: userId, reached_id: targetId })
      updateStatus(targetId, null)
    } else {
      const status = isPrivate ? 'pending' : 'accepted'
      await supabase.from('reaches').insert({ reacher_id: userId, reached_id: targetId, status })
      updateStatus(targetId, status)
    }
  }

  function updateStatus(targetId: string, status: ReachStatus | null) {
    setSuggested(prev => prev.map(u => u.id === targetId ? { ...u, reachStatus: status } : u))
    setResults(prev => prev.map(u => u.id === targetId ? { ...u, reachStatus: status } : u))
  }

  function renderUser({ item }: { item: UserWithReach }) {
    const initial = (item.username ?? '?')[0].toUpperCase()
    const isReaching = item.reachStatus === 'accepted'
    const isPending = item.reachStatus === 'pending'

    return (
      <TouchableOpacity style={s.userRow} onPress={() => router.push(`/profile/${item.id}`)}>
        {item.avatar_url ? (
          <Image source={{ uri: item.avatar_url }} style={s.avatar} />
        ) : (
          <View style={s.avatarPlaceholder}>
            <Text style={s.avatarText}>{initial}</Text>
          </View>
        )}
        <View style={s.userInfo}>
          <Text style={s.username}>@{item.username}</Text>
          {item.full_name ? <Text style={s.fullName}>{item.full_name}</Text> : null}
        </View>
        {item.is_private && <Ionicons name="lock-closed" size={12} color={colors.textDim} style={{ marginRight: spacing.xs }} />}
        <TouchableOpacity
          style={[s.reachBtn, isReaching && s.reachBtnActive, isPending && s.reachBtnPending]}
          onPress={() => handleReach(item.id, item.reachStatus, !!item.is_private)}
        >
          <Text style={[s.reachBtnText, (isReaching || isPending) && s.reachBtnTextActive]}>
            {isReaching ? i18n.t('reach.reaching') : isPending ? i18n.t('reach.requested') : i18n.t('reach.reach')}
          </Text>
        </TouchableOpacity>
      </TouchableOpacity>
    )
  }

  const showSearch = query.trim().length > 0

  return (
    <View style={s.container}>
      <View style={s.header}>
        <TouchableOpacity onPress={() => router.back()} style={s.backBtn}>
          <Ionicons name="arrow-back" size={24} color={colors.white} />
        </TouchableOpacity>
        <Text style={s.title}>{i18n.t('explore.title')}</Text>
      </View>

      <View style={s.searchRow}>
        <Ionicons name="search-outline" size={18} color={colors.textMuted} style={s.searchIcon} />
        <TextInput
          style={s.searchInput}
          placeholder={i18n.t('explore.search_placeholder')}
          placeholderTextColor={colors.textPlaceholder}
          value={query}
          onChangeText={setQuery}
          autoCapitalize="none"
          autoCorrect={false}
        />
        {query.length > 0 && (
          <TouchableOpacity onPress={() => setQuery('')}>
            <Ionicons name="close-circle" size={18} color={colors.textDim} />
          </TouchableOpacity>
        )}
      </View>

      {showSearch ? (
        searching ? (
          <ActivityIndicator color={colors.primary} style={{ marginTop: spacing.xxl }} />
        ) : (
          <FlatList
            data={results}
            keyExtractor={item => item.id}
            renderItem={renderUser}
            ListHeaderComponent={<Text style={s.sectionTitle}>{i18n.t('explore.results')}</Text>}
            ListEmptyComponent={<Text style={s.empty}>{i18n.t('explore.no_results')}</Text>}
          />
        )
      ) : loading ? (
        <ActivityIndicator color={colors.primary} style={{ marginTop: spacing.xxl }} />
      ) : (
        <FlatList
          data={suggested}
          keyExtractor={item => item.id}
          renderItem={renderUser}
          ListHeaderComponent={<Text style={s.sectionTitle}>{i18n.t('explore.suggested')}</Text>}
          ListEmptyComponent={<Text style={s.empty}>{i18n.t('explore.suggested_empty')}</Text>}
        />
      )}
    </View>
  )
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg },
  header: {
    flexDirection: 'row', alignItems: 'center',
    paddingTop: 60, paddingBottom: spacing.sm,
    paddingHorizontal: spacing.md, gap: spacing.sm,
  },
  backBtn: { padding: spacing.xs },
  title: { color: colors.white, ...font.logo },
  searchRow: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: colors.input,
    borderRadius: radii.md, borderWidth: 1, borderColor: colors.inputBorder,
    marginHorizontal: spacing.md, marginBottom: spacing.md,
    paddingHorizontal: spacing.sm, paddingVertical: spacing.xs + 2,
    gap: spacing.xs,
  },
  searchIcon: { marginRight: 2 },
  searchInput: { flex: 1, ...font.body, color: colors.white },
  sectionTitle: {
    color: colors.textDim, ...font.label,
    paddingHorizontal: spacing.md, paddingVertical: spacing.sm,
  },
  empty: {
    color: colors.textDim, ...font.body,
    textAlign: 'center', marginTop: spacing.xxl,
  },
  userRow: {
    flexDirection: 'row', alignItems: 'center',
    paddingHorizontal: spacing.md, paddingVertical: spacing.sm + 2,
    borderBottomWidth: 1, borderBottomColor: colors.border,
    gap: spacing.sm,
  },
  avatar: { width: 44, height: 44, borderRadius: 22 },
  avatarPlaceholder: {
    width: 44, height: 44, borderRadius: 22,
    backgroundColor: colors.primary,
    justifyContent: 'center', alignItems: 'center',
  },
  avatarText: { color: colors.white, ...font.heading },
  userInfo: { flex: 1 },
  username: { color: colors.white, ...font.label },
  fullName: { color: colors.textMuted, ...font.small, marginTop: 2 },
  reachBtn: {
    borderRadius: radii.pill, borderWidth: 1, borderColor: colors.primary,
    paddingHorizontal: spacing.md, paddingVertical: spacing.xs + 2,
  },
  reachBtnActive: { backgroundColor: colors.primaryDim, borderColor: colors.primary },
  reachBtnPending: { borderColor: colors.textDim },
  reachBtnText: { color: colors.primary, ...font.buttonSm },
  reachBtnTextActive: { color: colors.textMuted },
})
