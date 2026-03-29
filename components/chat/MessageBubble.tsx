import { StyleSheet, Text, View } from 'react-native'
import { colors, font, radii, spacing } from '../../lib/theme'

type Message = {
  id: string
  content: string
  created_at: string
  user_id: string
  profiles: { username: string }
}

type Props = {
  message: Message
  isOwn: boolean
}

export default function MessageBubble({ message, isOwn }: Props) {
  const time = new Date(message.created_at).toLocaleTimeString('it-IT', {
    hour: '2-digit', minute: '2-digit',
  })

  return (
    <View style={[s.row, isOwn && s.rowOwn]}>
      <View style={[s.bubble, isOwn ? s.bubbleOwn : s.bubbleOther]}>
        {!isOwn && (
          <Text style={s.username}>@{message.profiles?.username}</Text>
        )}
        <Text style={[s.content, isOwn && s.contentOwn]}>{message.content}</Text>
        <Text style={[s.time, isOwn && s.timeOwn]}>{time}</Text>
      </View>
    </View>
  )
}

const s = StyleSheet.create({
  row: { paddingHorizontal: spacing.md, marginVertical: spacing.xs, alignItems: 'flex-start' },
  rowOwn: { alignItems: 'flex-end' },
  bubble: {
    maxWidth: '75%', borderRadius: radii.md,
    padding: spacing.sm + 2,
  },
  bubbleOther: {
    backgroundColor: colors.card,
    borderWidth: 1, borderColor: colors.border,
    borderTopLeftRadius: 4,
  },
  bubbleOwn: {
    backgroundColor: colors.primary,
    borderTopRightRadius: 4,
  },
  username: { color: colors.primary, ...font.small, marginBottom: 2 },
  content: { color: colors.white, ...font.body },
  contentOwn: { color: colors.white },
  time: { color: colors.textDim, ...font.small, marginTop: 4, alignSelf: 'flex-end' },
  timeOwn: { color: 'rgba(255,255,255,0.6)' },
})
