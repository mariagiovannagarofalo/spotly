import { StyleSheet, Text, TouchableOpacity, View } from 'react-native'
import { colors, font, radii, spacing } from '../../lib/theme'
import { Plan } from '../../types'

type Props = {
  plan: Plan
  currentUserId: string | null
  onJoin: () => void
}

function formatDate(date: string) {
  return new Date(date).toLocaleDateString('it-IT', {
    day: 'numeric', month: 'short', year: 'numeric',
  })
}

export default function PlanCard({ plan, currentUserId, onJoin }: Props) {
  const joinCount = plan.plan_participants?.length ?? 0
  const hasJoined = plan.plan_participants?.some(pp => pp.user_id === currentUserId)
  const isOwner = plan.profiles?.id === currentUserId
  const initial = (plan.profiles?.username ?? '?')[0].toUpperCase()
  const dateLabel = plan.end_date
    ? `${formatDate(plan.start_date)} → ${formatDate(plan.end_date)}`
    : formatDate(plan.start_date)

  return (
    <View style={s.card}>
      <View style={s.topRow}>
        <View style={s.avatar}>
          <Text style={s.avatarText}>{initial}</Text>
        </View>
        <View style={{ flex: 1 }}>
          <Text style={s.username}>@{plan.profiles?.username ?? 'utente'}</Text>
          <Text style={s.date}>{dateLabel}</Text>
        </View>
      </View>

      <Text style={s.title}>{plan.title}</Text>
      {plan.description ? <Text style={s.description}>{plan.description}</Text> : null}

      <View style={s.locationRow}>
        <Text>📍</Text>
        <Text style={s.location}>{plan.location}</Text>
      </View>

      <View style={s.footer}>
        <Text style={s.joinCount}>
          {joinCount > 0
            ? `${joinCount} ${joinCount === 1 ? 'persona' : 'persone'} ci vanno`
            : 'Sii il primo a unirti'}
        </Text>
        {!isOwner && (
          <TouchableOpacity
            style={[s.joinButton, hasJoined && s.joinedButton]}
            onPress={onJoin}
          >
            <Text style={[s.joinText, hasJoined && s.joinedText]}>
              {hasJoined ? '✓ Joined' : 'JOIN'}
            </Text>
          </TouchableOpacity>
        )}
      </View>
    </View>
  )
}

const s = StyleSheet.create({
  card: {
    backgroundColor: colors.card,
    borderRadius: radii.lg,
    padding: spacing.md,
    marginHorizontal: spacing.md,
    marginTop: spacing.sm + 4,
    borderWidth: 1,
    borderColor: colors.border,
  },
  topRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.sm + 4,
    gap: spacing.sm + 2,
  },
  avatar: {
    width: 36, height: 36, borderRadius: 18,
    backgroundColor: colors.primary,
    justifyContent: 'center', alignItems: 'center',
  },
  avatarText: { color: colors.white, ...font.label },
  username: { color: colors.textMuted, ...font.label },
  date: { color: colors.textDim, ...font.small, marginTop: 2 },
  title: { color: colors.white, ...font.heading, marginBottom: spacing.xs },
  description: { color: colors.textMuted, ...font.body, marginBottom: spacing.sm },
  locationRow: {
    flexDirection: 'row', alignItems: 'center',
    gap: spacing.xs, marginBottom: spacing.sm + 4,
  },
  location: { color: colors.primary, ...font.label },
  footer: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  joinCount: { color: colors.textDim, ...font.label },
  joinButton: {
    backgroundColor: colors.primary,
    borderRadius: radii.pill,
    paddingHorizontal: spacing.md + 4,
    paddingVertical: spacing.sm,
  },
  joinedButton: {
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: colors.primary,
  },
  joinText: { color: colors.white, ...font.buttonSm },
  joinedText: { color: colors.primary },
})
