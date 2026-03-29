import { useEffect, useRef, useState } from 'react'
import {
  FlatList, KeyboardAvoidingView, Platform,
  StyleSheet, Text, TextInput, TouchableOpacity, View,
} from 'react-native'
import { useLocalSearchParams, useRouter } from 'expo-router'
import MessageBubble from '../../components/chat/MessageBubble'
import { supabase } from '../../lib/supabase'
import { colors, font, radii, spacing } from '../../lib/theme'

export default function ChatRoom() {
  const { planId } = useLocalSearchParams<{ planId: string }>()
  const [messages, setMessages] = useState<any[]>([])
  const [text, setText] = useState('')
  const [userId, setUserId] = useState<string | null>(null)
  const [planTitle, setPlanTitle] = useState('')
  const listRef = useRef<FlatList>(null)
  const router = useRouter()

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (user) setUserId(user.id)
    })
    fetchPlanTitle()
    fetchMessages()

    // Real-time
    const channel = supabase
      .channel(`chat:${planId}`)
      .on('postgres_changes', {
        event: 'INSERT', schema: 'public', table: 'messages',
        filter: `plan_id=eq.${planId}`,
      }, payload => {
        fetchMessages()
      })
      .subscribe()

    return () => { supabase.removeChannel(channel) }
  }, [planId])

  async function fetchPlanTitle() {
    const { data } = await supabase.from('plans').select('title').eq('id', planId).single()
    if (data) setPlanTitle(data.title)
  }

  async function fetchMessages() {
    const { data } = await supabase
      .from('messages')
      .select('*, profiles (username)')
      .eq('plan_id', planId)
      .order('created_at', { ascending: true })
    setMessages(data || [])
    setTimeout(() => listRef.current?.scrollToEnd({ animated: true }), 100)
  }

  async function sendMessage() {
    if (!text.trim() || !userId) return
    const content = text.trim()
    setText('')
    await supabase.from('messages').insert({
      plan_id: planId,
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
      <View style={s.header}>
        <TouchableOpacity onPress={() => router.back()} style={s.backBtn}>
          <Text style={s.backText}>‹</Text>
        </TouchableOpacity>
        <View style={s.headerInfo}>
          <Text style={s.headerTitle} numberOfLines={1}>{planTitle}</Text>
          <Text style={s.headerSub}>chat del piano</Text>
        </View>
      </View>

      <FlatList
        ref={listRef}
        data={messages}
        keyExtractor={item => item.id}
        contentContainerStyle={s.messageList}
        renderItem={({ item }) => (
          <MessageBubble message={item} isOwn={item.user_id === userId} />
        )}
        onContentSizeChange={() => listRef.current?.scrollToEnd({ animated: false })}
      />

      <View style={s.inputRow}>
        <TextInput
          style={s.input}
          placeholder="Scrivi un messaggio..."
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
