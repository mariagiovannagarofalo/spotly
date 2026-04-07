import { Modal, Pressable, StyleSheet, Text, TouchableOpacity, View } from 'react-native'
import i18n from '../../lib/i18n'
import { colors, font, radii, spacing } from '../../lib/theme'

type Props = {
  visible: boolean
  onClose: () => void
  onSelectPiano: () => void
  onSelectGruppo: () => void
  onSelectChat: () => void
}

const OPTION_KEYS = ['piano', 'gruppo', 'chat'] as const
type OptionKey = typeof OPTION_KEYS[number]

export default function CreateMenu({ visible, onClose, onSelectPiano, onSelectGruppo, onSelectChat }: Props) {
  const options = [
    { icon: '📅', label: i18n.t('menu.plan_label'), sub: i18n.t('menu.plan_sub'), key: 'piano' as OptionKey },
    { icon: '👥', label: i18n.t('menu.group_label'), sub: i18n.t('menu.group_sub'), key: 'gruppo' as OptionKey },
    { icon: '💬', label: i18n.t('menu.chat_label'), sub: i18n.t('menu.chat_sub'), key: 'chat' as OptionKey },
  ]

  function handleSelect(key: OptionKey) {
    onClose()
    if (key === 'piano') onSelectPiano()
    else if (key === 'gruppo') onSelectGruppo()
    else onSelectChat()
  }

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <Pressable style={s.overlay} onPress={onClose}>
        <Pressable style={s.sheet} onPress={e => e.stopPropagation()}>
          <View style={s.handle} />
          <Text style={s.title}>{i18n.t('menu.title')}</Text>

          {options.map((opt, i) => (
            <TouchableOpacity
              key={opt.key}
              style={[s.option, i < options.length - 1 && s.optionBorder]}
              onPress={() => handleSelect(opt.key)}
            >
              <Text style={s.optionIcon}>{opt.icon}</Text>
              <View style={s.optionText}>
                <Text style={s.optionLabel}>{opt.label}</Text>
                <Text style={s.optionSub}>{opt.sub}</Text>
              </View>
              <Text style={s.chevron}>›</Text>
            </TouchableOpacity>
          ))}
        </Pressable>
      </Pressable>
    </Modal>
  )
}

const s = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  sheet: {
    backgroundColor: colors.card,
    borderTopLeftRadius: radii.lg,
    borderTopRightRadius: radii.lg,
    paddingBottom: spacing.xxl,
    borderTopWidth: 1,
    borderColor: colors.border,
  },
  handle: {
    width: 40, height: 4, backgroundColor: colors.dimmed,
    borderRadius: 2, alignSelf: 'center', marginTop: spacing.sm + 4, marginBottom: spacing.sm,
  },
  title: {
    color: colors.textDim, ...font.label,
    textAlign: 'center', marginBottom: spacing.sm,
  },
  option: {
    flexDirection: 'row', alignItems: 'center',
    paddingHorizontal: spacing.md, paddingVertical: spacing.md + 2,
    gap: spacing.md,
  },
  optionBorder: { borderBottomWidth: 1, borderBottomColor: colors.border },
  optionIcon: { fontSize: 26, width: 36, textAlign: 'center' },
  optionText: { flex: 1 },
  optionLabel: { color: colors.white, ...font.heading },
  optionSub: { color: colors.textDim, ...font.small, marginTop: 2 },
  chevron: { color: colors.textDim, fontSize: 22, fontWeight: '300' },
})
