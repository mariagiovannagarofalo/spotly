import { Ionicons } from '@expo/vector-icons'
import { ActionSheetIOS, Alert, Image, Linking, Platform, StyleSheet, Text, TouchableOpacity, View } from 'react-native'
import i18n from '../../lib/i18n'
import { colors, font, radii, spacing } from '../../lib/theme'
import { Plan } from '../../types'

type Props = {
  plan: Plan
  currentUserId: string | null
  onJoin: () => void
  onEdit?: () => void
  onDelete?: () => void
}

function formatDate(date: string) {
  return new Date(date + 'T12:00:00').toLocaleDateString(i18n.locale, {
    day: 'numeric', month: 'short', year: 'numeric',
  })
}

export default function PlanCard({ plan, currentUserId, onJoin, onEdit, onDelete }: Props) {
  const joinCount = plan.plan_participants?.length ?? 0
  const hasJoined = plan.plan_participants?.some(pp => pp.user_id === currentUserId)
  const isOwner = plan.profiles?.id === currentUserId
  const initial = (plan.profiles?.username ?? '?')[0].toUpperCase()
  const dateLabel = plan.end_date
    ? `${formatDate(plan.start_date)} → ${formatDate(plan.end_date)}`
    : formatDate(plan.start_date)

  function showMenu() {
    const confirmDelete = () => {
      Alert.alert(i18n.t('plan.delete_confirm'), i18n.t('plan.delete_confirm_body'), [
        { text: i18n.t('plan.cancel'), style: 'cancel' },
        { text: i18n.t('plan.delete'), style: 'destructive', onPress: onDelete },
      ])
    }

    if (Platform.OS === 'ios') {
      ActionSheetIOS.showActionSheetWithOptions(
        {
          options: [i18n.t('plan.cancel'), i18n.t('plan.edit_title'), i18n.t('plan.delete_confirm')],
          cancelButtonIndex: 0,
          destructiveButtonIndex: 2,
        },
        (idx) => {
          if (idx === 1) onEdit?.()
          if (idx === 2) confirmDelete()
        }
      )
    } else {
      Alert.alert(plan.title, undefined, [
        { text: i18n.t('plan.cancel'), style: 'cancel' },
        { text: i18n.t('plan.edit_title'), onPress: onEdit },
        { text: i18n.t('plan.delete_confirm'), style: 'destructive', onPress: confirmDelete },
      ])
    }
  }

  const joinLabel = joinCount > 0
    ? i18n.t(joinCount === 1 ? 'plan.people_going_one' : 'plan.people_going_other', { count: joinCount })
    : i18n.t('plan.be_first')

  return (
    <View style={[s.card, { borderLeftColor: plan.color ?? colors.primary }]}>
      {plan.photo_url ? (
        <Image source={{ uri: plan.photo_url }} style={s.photo} />
      ) : null}

      <View style={s.content}>
        <View style={s.topRow}>
          {plan.profiles?.avatar_url ? (
            <Image source={{ uri: plan.profiles.avatar_url }} style={s.avatarImage} />
          ) : (
            <View style={s.avatar}>
              <Text style={s.avatarText}>{initial}</Text>
            </View>
          )}
          <View style={{ flex: 1 }}>
            <Text style={s.username}>@{plan.profiles?.username ?? i18n.t('plan.user_default')}</Text>
            <Text style={s.date}>{dateLabel}</Text>
          </View>
          {isOwner && (onEdit || onDelete) && (
            <TouchableOpacity style={s.dotsBtn} onPress={showMenu} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
              <Ionicons name="ellipsis-vertical" size={18} color={colors.textMuted} />
            </TouchableOpacity>
          )}
        </View>

        <View style={s.titleRow}>
          <Text style={s.title}>{plan.title}</Text>
          {plan.activity ? <Text style={s.activityBadge}>{plan.activity}</Text> : null}
        </View>
        {plan.description ? <Text style={s.description}>{plan.description}</Text> : null}

        <View style={s.locationRow}>
          <Text>📍</Text>
          <Text style={s.location}>{plan.location}</Text>
        </View>

        {plan.link ? (
          <TouchableOpacity style={s.linkRow} onPress={() => Linking.openURL(plan.link!)}>
            <Text style={s.linkText} numberOfLines={1}>🔗 {plan.link}</Text>
          </TouchableOpacity>
        ) : null}

        <View style={s.footer}>
          <Text style={s.joinCount}>{joinLabel}</Text>
          {!isOwner && (
            <TouchableOpacity
              style={[s.joinButton, hasJoined && s.joinedButton]}
              onPress={onJoin}
            >
              <Text style={[s.joinText, hasJoined && s.joinedText]}>
                {hasJoined ? i18n.t('plan.joined') : i18n.t('plan.join')}
              </Text>
            </TouchableOpacity>
          )}
        </View>
      </View>
    </View>
  )
}

const s = StyleSheet.create({
  card: {
    backgroundColor: colors.card,
    borderRadius: radii.lg,
    overflow: 'hidden',
    marginHorizontal: spacing.md,
    marginTop: spacing.sm + 4,
    borderWidth: 1,
    borderColor: colors.border,
    borderLeftWidth: 4,
  },
  photo: { width: '100%', height: 180 },
  content: { padding: spacing.md },
  topRow: {
    flexDirection: 'row', alignItems: 'center',
    marginBottom: spacing.sm + 4, gap: spacing.sm + 2,
  },
  avatar: {
    width: 36, height: 36, borderRadius: 18,
    backgroundColor: colors.primary,
    justifyContent: 'center', alignItems: 'center',
  },
  avatarImage: { width: 36, height: 36, borderRadius: 18 },
  avatarText: { color: colors.white, ...font.label },
  username: { color: colors.textMuted, ...font.label },
  date: { color: colors.textDim, ...font.small, marginTop: 2 },
  dotsBtn: { padding: spacing.xs },
  titleRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, marginBottom: spacing.xs },
  title: { color: colors.white, ...font.heading, flex: 1 },
  activityBadge: {
    color: colors.textDim, ...font.small,
    backgroundColor: colors.input, borderRadius: radii.pill,
    paddingHorizontal: spacing.sm, paddingVertical: 2,
    borderWidth: 1, borderColor: colors.border,
  },
  description: { color: colors.textMuted, ...font.body, marginBottom: spacing.sm },
  locationRow: {
    flexDirection: 'row', alignItems: 'center',
    gap: spacing.xs, marginBottom: spacing.sm,
  },
  location: { color: colors.primary, ...font.label },
  linkRow: { marginBottom: spacing.sm + 4, paddingVertical: spacing.xs },
  linkText: { color: colors.primary, ...font.small, textDecorationLine: 'underline' },
  footer: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  joinCount: { color: colors.textDim, ...font.label },
  joinButton: {
    backgroundColor: colors.primary, borderRadius: radii.pill,
    paddingHorizontal: spacing.md + 4, paddingVertical: spacing.sm,
  },
  joinedButton: { backgroundColor: 'transparent', borderWidth: 1, borderColor: colors.primary },
  joinText: { color: colors.white, ...font.buttonSm },
  joinedText: { color: colors.primary },
})
