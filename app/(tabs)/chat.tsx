import { useEffect, useState } from 'react'
import { ActivityIndicator, FlatList, StyleSheet, Text, View } from 'react-native'
import { useRouter } from 'expo-router'
import ChatListItem from '../../components/chat/ChatListItem'
import { supabase } from '../../lib/supabase'
import { colors, font, spacing } from '../../lib/theme'
import { Plan } from '../../types'

export default function ChatScreen() {
  const [plans, setPlans] = useState<Plan[]>([])
  const [loading, setLoading] = useState(true)
  const [userId, setUserId] = useState<string | null>(null)
  const router = useRouter()

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (user) {
        setUserId(user.id)
        fetchChats(user.id)
      }
    })
  }, [])

  async function fetchChats(uid: string) {
    setLoading(true)
    // Mostra i piani a cui hai joinato o che hai creato, con più di 1 partecipante
    const { data } = await supabase
      .from('plans')
      .select('*, profiles (id, username, full_name), plan_participants (user_id)')
      .or(`user_id.eq.${uid},plan_participants.user_id.eq.${uid}`)
      .order('created_at', { ascending: false })

    // Filtra solo piani con almeno 1 partecipante
    const withParticipants = (data as Plan[] || []).filter(
      p => (p.plan_participants?.length ?? 0) > 0
    )
    setPlans(withParticipants)
    setLoading(false)
  }

  return (
    <View style={s.container}>
      <Text style={s.header}>chat</Text>

      {loading ? (
        <ActivityIndicator color={colors.primary} style={{ marginTop: spacing.xxl }} />
      ) : plans.length === 0 ? (
        <View style={s.empty}>
          <Text style={s.emptyText}>Nessuna chat ancora.</Text>
          <Text style={s.emptySubtext}>Fai JOIN a un piano per entrare nella chat!</Text>
        </View>
      ) : (
        <FlatList
          data={plans}
          keyExtractor={item => item.id}
          renderItem={({ item }) => (
            <ChatListItem
              plan={item}
              onPress={() => router.push(`/chat/${item.id}`)}
            />
          )}
        />
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
  empty: { flex: 1, justifyContent: 'center', alignItems: 'center', paddingHorizontal: spacing.xl },
  emptyText: { color: colors.white, ...font.heading, textAlign: 'center' },
  emptySubtext: { color: colors.textDim, ...font.label, marginTop: spacing.sm, textAlign: 'center' },
})
