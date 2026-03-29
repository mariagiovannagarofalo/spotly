import { useState } from 'react'
import {
  ActivityIndicator, FlatList, StyleSheet,
  Text, TextInput, TouchableOpacity, View,
} from 'react-native'
import i18n from '../../lib/i18n'
import { colors, font, radii, spacing } from '../../lib/theme'

type Result = { name: string; lat: string; lon: string; display_name: string }

type Props = {
  value: string
  onSelect: (name: string, lat: number, lon: number) => void
}

export default function LocationSearch({ value, onSelect }: Props) {
  const [query, setQuery] = useState(value)
  const [results, setResults] = useState<Result[]>([])
  const [loading, setLoading] = useState(false)
  const [selected, setSelected] = useState(!!value)

  async function search(text: string) {
    setQuery(text)
    setSelected(false)
    if (text.length < 3) { setResults([]); return }
    setLoading(true)
    try {
      const res = await fetch(
        `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(text)}&format=json&limit=5`,
        { headers: { 'User-Agent': 'Spotly/1.0' } }
      )
      const data = await res.json()
      setResults(data || [])
    } catch {
      setResults([])
    }
    setLoading(false)
  }

  function pick(item: Result) {
    const name = item.display_name.split(',').slice(0, 2).join(',').trim()
    setQuery(name)
    setResults([])
    setSelected(true)
    onSelect(name, parseFloat(item.lat), parseFloat(item.lon))
  }

  return (
    <View>
      <View style={s.inputRow}>
        <TextInput
          style={s.input}
          placeholder={i18n.t('plan.location_placeholder')}
          placeholderTextColor={colors.textPlaceholder}
          value={query}
          onChangeText={search}
        />
        {loading && <ActivityIndicator color={colors.primary} style={s.spinner} />}
      </View>

      {results.length > 0 && !selected && (
        <View style={s.dropdown}>
          {results.map((item, i) => {
            const label = item.display_name.split(',').slice(0, 2).join(',').trim()
            return (
              <TouchableOpacity
                key={i}
                style={[s.result, i < results.length - 1 && s.resultBorder]}
                onPress={() => pick(item)}
              >
                <Text style={s.resultText} numberOfLines={1}>📍 {label}</Text>
              </TouchableOpacity>
            )
          })}
        </View>
      )}
    </View>
  )
}

const s = StyleSheet.create({
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
    overflow: 'hidden',
  },
  result: { padding: spacing.sm + 4 },
  resultBorder: { borderBottomWidth: 1, borderBottomColor: colors.border },
  resultText: { color: colors.white, ...font.body },
})
