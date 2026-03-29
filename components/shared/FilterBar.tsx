import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native'
import { colors, font, radii, spacing } from '../../lib/theme'

export type PlanFilters = {
  time: 'all' | 'today' | 'week' | 'month'
  activity: string
  onlyMine: boolean
  color: string | null
}

export const DEFAULT_FILTERS: PlanFilters = {
  time: 'all',
  activity: 'all',
  onlyMine: false,
  color: null,
}

const TIME_OPTIONS = [
  { value: 'all', label: 'Tutti' },
  { value: 'today', label: 'Oggi' },
  { value: 'week', label: '7 giorni' },
  { value: 'month', label: '30 giorni' },
]

const ACTIVITIES = [
  { value: 'all', label: 'Tutti', icon: '✦' },
  { value: 'viaggio', label: 'Viaggio', icon: '✈️' },
  { value: 'concerto', label: 'Concerto', icon: '🎵' },
  { value: 'sport', label: 'Sport', icon: '🏃' },
  { value: 'cena', label: 'Cena', icon: '🍽️' },
  { value: 'festa', label: 'Festa', icon: '🎉' },
  { value: 'natura', label: 'Natura', icon: '🌿' },
  { value: 'arte', label: 'Arte', icon: '🎨' },
  { value: 'altro', label: 'Altro', icon: '📌' },
]

const PLAN_COLORS = [
  '#6C63FF', '#FF6584', '#43C6AC', '#F7971E',
  '#4facfe', '#43e97b', '#fa709a', '#fee140',
]

type Props = {
  filters: PlanFilters
  onChange: (f: PlanFilters) => void
  dark?: boolean  // per la mappa (sfondo semi-trasparente)
}

export default function FilterBar({ filters, onChange, dark }: Props) {
  const hasActive = filters.time !== 'all' || filters.activity !== 'all'
    || filters.onlyMine || filters.color !== null

  const bg = dark ? 'rgba(10,10,10,0.85)' : colors.bg

  return (
    <View style={[s.container, { backgroundColor: bg }]}>
      {/* Riga 1: Tempo + Solo miei + Reset */}
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={s.row}>
        {TIME_OPTIONS.map(opt => (
          <TouchableOpacity
            key={opt.value}
            style={[s.chip, filters.time === opt.value && s.chipActive]}
            onPress={() => onChange({ ...filters, time: opt.value as PlanFilters['time'] })}
          >
            <Text style={[s.chipText, filters.time === opt.value && s.chipTextActive]}>
              {opt.label}
            </Text>
          </TouchableOpacity>
        ))}
        <View style={s.sep} />
        <TouchableOpacity
          style={[s.chip, filters.onlyMine && s.chipActive]}
          onPress={() => onChange({ ...filters, onlyMine: !filters.onlyMine })}
        >
          <Text style={[s.chipText, filters.onlyMine && s.chipTextActive]}>👤 Solo miei</Text>
        </TouchableOpacity>
        {hasActive && (
          <>
            <View style={s.sep} />
            <TouchableOpacity style={s.resetBtn} onPress={() => onChange(DEFAULT_FILTERS)}>
              <Text style={s.resetText}>✕ Reset</Text>
            </TouchableOpacity>
          </>
        )}
      </ScrollView>

      {/* Riga 2: Attività */}
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={s.row}>
        {ACTIVITIES.map(act => (
          <TouchableOpacity
            key={act.value}
            style={[s.chip, filters.activity === act.value && s.chipActive]}
            onPress={() => onChange({ ...filters, activity: act.value })}
          >
            <Text style={[s.chipText, filters.activity === act.value && s.chipTextActive]}>
              {act.icon} {act.label}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {/* Riga 3: Colori */}
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={[s.row, s.colorRow]}>
        <TouchableOpacity
          style={[s.colorDot, s.colorDotAll, filters.color === null && s.colorDotActive]}
          onPress={() => onChange({ ...filters, color: null })}
        >
          <Text style={s.colorDotAllText}>✦</Text>
        </TouchableOpacity>
        {PLAN_COLORS.map(c => (
          <TouchableOpacity
            key={c}
            style={[s.colorDot, { backgroundColor: c }, filters.color === c && s.colorDotActive]}
            onPress={() => onChange({ ...filters, color: filters.color === c ? null : c })}
          />
        ))}
      </ScrollView>
    </View>
  )
}

const s = StyleSheet.create({
  container: { borderBottomWidth: 1, borderBottomColor: colors.border },
  row: {
    flexDirection: 'row', alignItems: 'center',
    paddingHorizontal: spacing.md, paddingVertical: spacing.xs + 2,
    gap: spacing.xs,
  },
  colorRow: { paddingVertical: spacing.sm },
  chip: {
    backgroundColor: colors.card, borderRadius: radii.pill,
    paddingHorizontal: spacing.sm + 4, paddingVertical: spacing.xs + 2,
    borderWidth: 1, borderColor: colors.border,
  },
  chipActive: { backgroundColor: colors.primaryDim, borderColor: colors.primary },
  chipText: { color: colors.textDim, ...font.small },
  chipTextActive: { color: colors.primary, fontWeight: '700' },
  sep: { width: 1, height: 18, backgroundColor: colors.border, marginHorizontal: spacing.xs },
  resetBtn: {
    borderRadius: radii.pill, paddingHorizontal: spacing.sm + 4,
    paddingVertical: spacing.xs + 2, borderWidth: 1, borderColor: colors.border,
  },
  resetText: { color: colors.textDim, ...font.small },
  colorDot: {
    width: 26, height: 26, borderRadius: 13,
    borderWidth: 2, borderColor: 'transparent',
  },
  colorDotAll: {
    backgroundColor: colors.card, borderColor: colors.border,
    justifyContent: 'center', alignItems: 'center',
  },
  colorDotAllText: { color: colors.textDim, fontSize: 11 },
  colorDotActive: { borderColor: colors.white, transform: [{ scale: 1.25 }] },
})
