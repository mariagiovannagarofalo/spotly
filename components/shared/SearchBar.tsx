import { StyleSheet, TextInput, TouchableOpacity, View, Text } from 'react-native'
import i18n from '../../lib/i18n'
import { colors, font, radii, spacing } from '../../lib/theme'

type Props = {
  value: string
  onChange: (text: string) => void
  placeholder?: string
  dark?: boolean
}

export default function SearchBar({ value, onChange, placeholder, dark }: Props) {
  const resolvedPlaceholder = placeholder ?? i18n.t('search.placeholder')
  const bg = dark ? 'rgba(20,20,20,0.92)' : colors.input
  const border = dark ? 'rgba(255,255,255,0.1)' : colors.inputBorder

  return (
    <View style={[s.container, { backgroundColor: bg, borderColor: border }]}>
      <Text style={s.icon}>🔍</Text>
      <TextInput
        style={s.input}
        value={value}
        onChangeText={onChange}
        placeholder={resolvedPlaceholder}
        placeholderTextColor={colors.textPlaceholder}
        autoCapitalize="none"
        autoCorrect={false}
      />
      {value.length > 0 && (
        <TouchableOpacity onPress={() => onChange('')} style={s.clear}>
          <Text style={s.clearText}>✕</Text>
        </TouchableOpacity>
      )}
    </View>
  )
}

const s = StyleSheet.create({
  container: {
    flexDirection: 'row', alignItems: 'center',
    borderRadius: radii.pill, borderWidth: 1,
    paddingHorizontal: spacing.sm + 4, paddingVertical: spacing.sm,
    marginHorizontal: spacing.md, marginVertical: spacing.xs,
  },
  icon: { fontSize: 15, marginRight: spacing.sm },
  input: {
    flex: 1, color: colors.white, ...font.body,
  },
  clear: { padding: spacing.xs },
  clearText: { color: colors.textDim, fontSize: 13 },
})
