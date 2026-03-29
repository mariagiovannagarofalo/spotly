import { useState } from 'react'
import {
  ActivityIndicator, StyleSheet, Text,
  TextInput, TouchableOpacity, View,
} from 'react-native'
import { supabase } from '../../lib/supabase'
import { colors, font, radii, spacing } from '../../lib/theme'
import { Profile } from '../../types'

type Props = {
  currentUserId: string | null
  selected: Profile[]
  onAdd: (profile: Profile) => void
  onRemove: (id: string) => void
}

export default function FriendSearch({ currentUserId, selected, onAdd, onRemove }: Props) {
  const [query, setQuery] = useState('')
  const [results, setResults] = useState<Profile[]>([])
  const [loading, setLoading] = useState(false)

  async function search(text: string) {
    setQuery(text)
    if (text.length < 2) { setResults([]); return }
    setLoading(true)
    const { data } = await supabase
      .from('profiles')
      .select('*')
      .ilike('username', `%${text}%`)
      .neq('id', currentUserId)
      .limit(5)
    setResults((data as Profile[]) || [])
    setLoading(false)
  }

  function add(profile: Profile) {
    if (selected.find(p => p.id === profile.id)) return
    onAdd(profile)
    setQuery('')
    setResults([])
  }

  return (
    <View>
      {selected.length > 0 && (
        <View style={s.tags}>
          {selected.map(p => (
            <View key={p.id} style={s.tag}>
              <Text style={s.tagText}>@{p.username}</Text>
              <TouchableOpacity onPress={() => onRemove(p.id)}>
                <Text style={s.tagRemove}>✕</Text>
              </TouchableOpacity>
            </View>
          ))}
        </View>
      )}

      <View style={s.inputRow}>
        <TextInput
          style={s.input}
          placeholder="Cerca username..."
          placeholderTextColor={colors.textPlaceholder}
          value={query}
          onChangeText={search}
          autoCapitalize="none"
          autoCorrect={false}
        />
        {loading && <ActivityIndicator color={colors.primary} style={s.spinner} />}
      </View>

      {results.length > 0 && (
        <View style={s.dropdown}>
          {results.map((item, i) => (
            <TouchableOpacity
              key={item.id}
              style={[s.result, i < results.length - 1 && s.resultBorder]}
              onPress={() => add(item)}
            >
              <View style={s.resultAvatar}>
                <Text style={s.resultAvatarText}>{item.username[0].toUpperCase()}</Text>
              </View>
              <View>
                <Text style={s.resultUsername}>@{item.username}</Text>
                {item.full_name ? <Text style={s.resultName}>{item.full_name}</Text> : null}
              </View>
            </TouchableOpacity>
          ))}
        </View>
      )}
    </View>
  )
}

const s = StyleSheet.create({
  tags: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.xs, marginBottom: spacing.sm },
  tag: {
    flexDirection: 'row', alignItems: 'center', gap: spacing.xs,
    backgroundColor: colors.primaryDim, borderRadius: radii.pill,
    paddingHorizontal: spacing.sm + 2, paddingVertical: spacing.xs,
    borderWidth: 1, borderColor: colors.primary,
  },
  tagText: { color: colors.primary, ...font.small },
  tagRemove: { color: colors.primary, fontSize: 12 },
  inputRow: { flexDirection: 'row', alignItems: 'center' },
  input: {
    flex: 1, backgroundColor: colors.input, borderRadius: radii.md,
    padding: spacing.sm + 6, ...font.body, color: colors.white,
    borderWidth: 1, borderColor: colors.inputBorder,
  },
  spinner: { position: 'absolute', right: spacing.sm },
  dropdown: {
    backgroundColor: colors.card, borderRadius: radii.md,
    borderWidth: 1, borderColor: colors.border, marginTop: spacing.xs,
  },
  result: { flexDirection: 'row', alignItems: 'center', padding: spacing.sm + 2, gap: spacing.sm },
  resultBorder: { borderBottomWidth: 1, borderBottomColor: colors.border },
  resultAvatar: {
    width: 32, height: 32, borderRadius: 16,
    backgroundColor: colors.primary,
    justifyContent: 'center', alignItems: 'center',
  },
  resultAvatarText: { color: colors.white, ...font.label },
  resultUsername: { color: colors.white, ...font.label },
  resultName: { color: colors.textDim, ...font.small },
})
