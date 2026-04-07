import { useEffect, useRef, useState } from 'react'
import {
  FlatList, KeyboardAvoidingView, Platform, ScrollView,
  StyleSheet, Text, TextInput, TouchableOpacity, View,
} from 'react-native'
import { useLocalSearchParams, useRouter } from 'expo-router'
import MessageBubble from '../../../components/chat/MessageBubble'
import i18n from '../../../lib/i18n'
import { supabase } from '../../../lib/supabase'
import { colors, font, radii, spacing } from '../../../lib/theme'
import { Plan } from '../../../types'

type GroupMessage = {
  id: string
  group_id: string
  user_id: string
  content: string
  created_at: string
  profiles?: { username: string }
}

export default function GroupChatRoom() {
  const { groupId } = useLocalSearchParams<{ groupId: string }>()
  const router = useRouter()
  const listRef = useRef<FlatList>(null)

  const [groupName, setGroupName] = useState('')
  const [messages, setMessages] = useState<GroupMessage[]>([])
  const [plans, setPlans] = useState<Plan[]>([])
  const [text, setText] = useState('')
  const [userId, setUserId] = useState<string | null>(null)

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (user) setUserId(user.id)
    })
    fetchGroupInfo()
    fetchMessages()
    fetchGroupPlans()

    const channel = supabase
      .channel(`group-chat:${groupId}`)
      .on('postgres_changes', {
        event: 'INSERT', schema: 'public', table: 'group_messages',
        filter: `group_id=eq.${groupId}`,
      }, () => fetchMessages())
      .subscribe()

    return () => { supabase.removeChannel(channel) }
  }, [groupId])

  async function fetchGroupInfo() {
    const { data } = await supabase
      .from('groups')
      .select('name')
      .eq('id', groupId)
      .single()
    if (data) setGroupName(data.name)
  }

  async function fetchMessages() {
    const { data } = await supabase
      .from('group_messages')
      .select('*, profiles (username)')
      .eq('group_id', groupId)
      .order('created_at', { ascending: true })
    setMessages((data as GroupMessage[]) || [])
    setTimeout(() => listRef.current?.scrollToEnd({ animated: true }), 100)
  }

  async function fetchGroupPlans() {
    const { data } = await supabase
      .from('plan_groups')
      .select('plan_id, plans (*, profiles (id, username, full_name, avatar_url), plan_participants (user_id))')
      .eq('group_id', groupId)
    const p = (data ?? []).map((row: any) => row.plans).filter(Boolean) as Plan[]
    setPlans(p)
  }

  async function sendMessage() {
    if (!text.trim() || !userId) return
    const content = text.trim()
    setText('')
    await supabase.from('group_messages').insert({
      group_id: groupId,
      user_id: userId,
      content,
    })
  }

  return (
    <KeyboardAvoidingView
      style={s.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      keyboardVerticalOffset={0}
    >
      {/* Header */}
      <View style={s.header}>
        <TouchableOpacity onPress={() => router.back()} style={s.backBtn}>
          <Text style={s.backText}>‹</Text>
        </TouchableOpacity>
        <View style={s.headerInfo}>
          <Text style={s.headerTitle} numberOfLines={1}>{groupName}</Text>
          <Text style={s.headerSub}>{i18n.t('chat.group_subtitle')}</Text>
        </View>
      </View>

      {/* Programmi del gruppo */}
      {plans.length > 0 && (
        <View style={s.plansSection}>
          <Text style={s.plansSectionTitle}>{i18n.t('chat.group_plans_title')}</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={s.plansScroll}>
            {plans.map(plan => (
              <View key={plan.id} style={[s.planCard, { borderLeftColor: plan.color ?? colors.primary }]}>
                <Text style={s.planTitle} numberOfLines={1}>{plan.title}</Text>
                <Text style={s.planDate}>{new Date(plan.start_date + 'T12:00:00').toLocaleDateString('it-IT', { day: 'numeric', month: 'short' })}</Text>
                <Text style={s.planLocation} numberOfLines={1}>📍 {plan.location}</Text>
              </View>
            ))}
          </ScrollView>
        </View>
      )}

      {/* Messaggi */}
      <FlatList
        ref={listRef}
        data={messages}
        keyExtractor={item => item.id}
        contentContainerStyle={s.messageList}
        renderItem={({ item }) => (
          <MessageBubble
            message={{ ...item, profiles: item.profiles }}
            isOwn={item.user_id === userId}
          />
        )}
        onContentSizeChange={() => listRef.current?.scrollToEnd({ animated: false })}
      />

      {/* Input */}
      <View style={s.inputRow}>
        <TextInput
          style={s.input}
          placeholder={i18n.t('chat.placeholder')}
          placeholderTextColor={colors.textPlaceholder}
          value={text}
          onChangeText={setText}
          multiline
        />
        <TouchableOpacity
          style={[s.sendBtn, !text.trim() && s.sendBtnDisabled]}
          onPress={sendMessage}
          disabled={!text.trim()}
        >
          <Text style={s.sendText}>↑</Text>
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  )
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg },
  header: {
    flexDirection: 'row', alignItems: 'center',
    paddingTop: 60, paddingBottom: spacing.sm,
    paddingHorizontal: spacing.md,
    borderBottomWidth: 1, borderBottomColor: colors.border,
    gap: spacing.sm,
  },
  backBtn: { padding: spacing.xs },
  backText: { color: colors.white, fontSize: 32, fontWeight: '300', lineHeight: 36 },
  headerInfo: { flex: 1 },
  headerTitle: { color: colors.white, ...font.heading },
  headerSub: { color: colors.textDim, ...font.small },
  plansSection: {
    borderBottomWidth: 1, borderBottomColor: colors.border,
    paddingVertical: spacing.sm,
  },
  plansSectionTitle: {
    color: colors.textMuted, ...font.small,
    paddingHorizontal: spacing.md, marginBottom: spacing.xs,
  },
  plansScroll: { paddingHorizontal: spacing.md, gap: spacing.sm },
  planCard: {
    backgroundColor: colors.card, borderRadius: radii.md,
    padding: spacing.sm + 2, borderLeftWidth: 3,
    borderWidth: 1, borderColor: colors.border,
    width: 140,
  },
  planTitle: { color: colors.white, ...font.label, marginBottom: 2 },
  planDate: { color: colors.primary, ...font.small, marginBottom: 2 },
  planLocation: { color: colors.textDim, ...font.small },
  messageList: { paddingVertical: spacing.md },
  inputRow: {
    flexDirection: 'row', alignItems: 'flex-end',
    paddingHorizontal: spacing.md, paddingVertical: spacing.sm,
    borderTopWidth: 1, borderTopColor: colors.border,
    gap: spacing.sm,
  },
  input: {
    flex: 1, backgroundColor: colors.input,
    borderRadius: radii.md, padding: spacing.sm + 4,
    ...font.body, color: colors.white,
    borderWidth: 1, borderColor: colors.inputBorder,
    maxHeight: 100,
  },
  sendBtn: {
    width: 40, height: 40, borderRadius: 20,
    backgroundColor: colors.primary,
    justifyContent: 'center', alignItems: 'center',
  },
  sendBtnDisabled: { backgroundColor: colors.inputBorder },
  sendText: { color: colors.white, fontSize: 18, fontWeight: '700' },
})
