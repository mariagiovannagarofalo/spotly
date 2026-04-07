import { useFocusEffect } from 'expo-router'
import { useCallback, useState } from 'react'
import { ActivityIndicator, FlatList, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native'
import { useRouter } from 'expo-router'
import ChatListItem from '../../components/chat/ChatListItem'
import i18n from '../../lib/i18n'
import { supabase } from '../../lib/supabase'
import { colors, font, radii, spacing } from '../../lib/theme'
import { Group, Plan } from '../../types'

export default function ChatScreen() {
  const [plans, setPlans] = useState<Plan[]>([])
  const [groups, setGroups] = useState<Group[]>([])
  const [loading, setLoading] = useState(true)
  const [userId, setUserId] = useState<string | null>(null)
  const router = useRouter()

  useFocusEffect(useCallback(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (user) {
        setUserId(user.id)
        fetchAll(user.id)
      }
    })
  }, []))

  async function fetchAll(uid: string) {
    setLoading(true)
    await Promise.all([fetchChats(uid), fetchGroups(uid)])
    setLoading(false)
  }

  async function fetchChats(uid: string) {
    const { data } = await supabase
      .from('plans')
      .select('*, profiles (id, username, full_name), plan_participants (user_id)')
      .or(`user_id.eq.${uid},plan_participants.user_id.eq.${uid}`)
      .order('created_at', { ascending: false })

    const withParticipants = (data as Plan[] || []).filter(
      p => (p.plan_participants?.length ?? 0) > 0
    )
    setPlans(withParticipants)
  }

  async function fetchGroups(uid: string) {
    const { data } = await supabase
      .from('group_members')
      .select('group_id, groups (id, owner_id, name, created_at)')
      .eq('user_id', uid)
    const g = (data ?? []).map((row: any) => row.groups).filter(Boolean) as Group[]
    setGroups(g)
  }

  return (
    <View style={s.container}>
      <Text style={s.header}>chat</Text>

      {loading ? (
        <ActivityIndicator color={colors.primary} style={{ marginTop: spacing.xxl }} />
      ) : (
        <ScrollView showsVerticalScrollIndicator={false}>

          {/* Chat di gruppo */}
          {groups.length > 0 && (
            <View style={s.section}>
              <Text style={s.sectionTitle}>{i18n.t('chat.groups_section')}</Text>
              {groups.map(g => (
                <TouchableOpacity
                  key={g.id}
                  style={s.groupRow}
                  onPress={() => router.push(`/chat/group/${g.id}`)}
                >
                  <View style={s.groupAvatar}>
                    <Text style={s.groupAvatarText}>{g.name[0].toUpperCase()}</Text>
                  </View>
                  <View style={s.groupInfo}>
                    <Text style={s.groupName}>{g.name}</Text>
                    <Text style={s.groupSub}>{i18n.t('chat.group_subtitle')}</Text>
                  </View>
                  <Text style={s.chevron}>›</Text>
                </TouchableOpacity>
              ))}
            </View>
          )}

          {/* Chat piani */}
          {plans.length > 0 && (
            <View style={s.section}>
              <Text style={s.sectionTitle}>{i18n.t('chat.plans_section')}</Text>
              {plans.map(item => (
                <ChatListItem
                  key={item.id}
                  plan={item}
                  onPress={() => router.push(`/chat/${item.id}`)}
                />
              ))}
            </View>
          )}

          {groups.length === 0 && plans.length === 0 && (
            <View style={s.empty}>
              <Text style={s.emptyText}>{i18n.t('chat.no_chats')}</Text>
              <Text style={s.emptySubtext}>{i18n.t('chat.no_chats_hint')}</Text>
            </View>
          )}
        </ScrollView>
      )}
    </View>
  )
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg },
  header: {
    color: colors.white, ...font.logo,
    paddingHorizontal: spacing.md,
    paddingTop: 60,
    paddingBottom: spacing.md,
  },
  section: { marginBottom: spacing.lg },
  sectionTitle: {
    color: colors.textDim, ...font.label,
    paddingHorizontal: spacing.md, marginBottom: spacing.xs,
  },
  groupRow: {
    flexDirection: 'row', alignItems: 'center',
    paddingHorizontal: spacing.md, paddingVertical: spacing.sm + 4,
    borderBottomWidth: 1, borderBottomColor: colors.border,
    gap: spacing.sm,
  },
  groupAvatar: {
    width: 44, height: 44, borderRadius: 22,
    backgroundColor: colors.primary,
    justifyContent: 'center', alignItems: 'center',
  },
  groupAvatarText: { color: colors.white, ...font.heading },
  groupInfo: { flex: 1 },
  groupName: { color: colors.white, ...font.heading },
  groupSub: { color: colors.textDim, ...font.small, marginTop: 2 },
  chevron: { color: colors.textDim, fontSize: 22, fontWeight: '300' },
  empty: { flex: 1, justifyContent: 'center', alignItems: 'center', paddingHorizontal: spacing.xl, paddingTop: spacing.xxl },
  emptyText: { color: colors.white, ...font.heading, textAlign: 'center' },
  emptySubtext: { color: colors.textDim, ...font.label, marginTop: spacing.sm, textAlign: 'center' },
})
