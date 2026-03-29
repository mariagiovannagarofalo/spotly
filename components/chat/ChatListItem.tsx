import { StyleSheet, Text, TouchableOpacity, View } from 'react-native'
import { colors, font, radii, spacing } from '../../lib/theme'
import { Plan } from '../../types'

type Props = {
  plan: Plan
  onPress: () => void
}

export default function ChatListItem({ plan, onPress }: Props) {
  const participantCount = plan.plan_participants?.length ?? 0

  return (
    <TouchableOpacity style={s.item} onPress={onPress}>
      <View style={s.avatar}>
        <Text style={s.avatarText}>📍</Text>
      </View>
      <View style={s.info}>
        <Text style={s.title} numberOfLines={1}>{plan.title}</Text>
        <Text style={s.sub} numberOfLines={1}>
          {plan.location} · {participantCount} {participantCount === 1 ? 'partecipante' : 'partecipanti'}
        </Text>
      </View>
      <Text style={s.arrow}>›</Text>
    </TouchableOpacity>
  )
}

const s = StyleSheet.create({
  item: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm + 4,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    gap: spacing.sm + 2,
  },
  avatar: {
    width: 44, height: 44, borderRadius: 22,
    backgroundColor: colors.card,
    justifyContent: 'center', alignItems: 'center',
    borderWidth: 1, borderColor: colors.border,
  },
  avatarText: { fontSize: 20 },
  info: { flex: 1 },
  title: { color: colors.white, ...font.label },
  sub: { color: colors.textDim, ...font.small, marginTop: 2 },
  arrow: { color: colors.textDim, fontSize: 22 },
})
