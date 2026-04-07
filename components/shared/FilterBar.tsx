import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native'
import i18n from '../../lib/i18n'
import { colors, font, planColors, radii, spacing } from '../../lib/theme'
import { Group } from '../../types'

export type PlanFilters = {
  time: 'all' | 'today' | 'week' | 'month'
  activity: string
  onlyMine: boolean
  color: string | null
  groupId: string | null
}

export const DEFAULT_FILTERS: PlanFilters = {
  time: 'all',
  activity: 'all',
  onlyMine: false,
  color: null,
  groupId: null,
}

const TIME_OPTIONS: { value: PlanFilters['time']; labelKey: string }[] = [
  { value: 'all', labelKey: 'filter.all' },
  { value: 'today', labelKey: 'filter.today' },
  { value: 'week', labelKey: 'filter.week' },
  { value: 'month', labelKey: 'filter.month' },
]

const ACTIVITIES: { value: string; labelKey: string; icon: string }[] = [
  { value: 'all', labelKey: 'filter.all', icon: '✦' },
  { value: 'viaggio', labelKey: 'plan.activity_travel', icon: '✈️' },
  { value: 'concerto', labelKey: 'plan.activity_concert', icon: '🎵' },
  { value: 'sport', labelKey: 'plan.activity_sport', icon: '🏃' },
  { value: 'cena', labelKey: 'plan.activity_dinner', icon: '🍽️' },
  { value: 'festa', labelKey: 'plan.activity_party', icon: '🎉' },
  { value: 'natura', labelKey: 'plan.activity_nature', icon: '🌿' },
  { value: 'arte', labelKey: 'plan.activity_art', icon: '🎨' },
  { value: 'altro', labelKey: 'plan.activity_other', icon: '📌' },
]

type Props = {
  filters: PlanFilters
  onChange: (f: PlanFilters) => void
  dark?: boolean
  groups?: Group[]
}

export default function FilterBar({ filters, onChange, dark, groups }: Props) {
  const hasActive = filters.time !== 'all' || filters.activity !== 'all'
    || filters.onlyMine || filters.color !== null || filters.groupId !== null

  const bg = dark ? 'rgba(10,10,10,0.85)' : colors.bg

  return (
    <View style={[s.container, { backgroundColor: bg }]}>
      {/* Row 1: Time + Only mine + Reset */}
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={s.row}>
        {TIME_OPTIONS.map(opt => (
          <TouchableOpacity
            key={opt.value}
            style={[s.chip, filters.time === opt.value && s.chipActive]}
            onPress={() => onChange({ ...filters, time: opt.value })}
          >
            <Text style={[s.chipText, filters.time === opt.value && s.chipTextActive]}>
              {i18n.t(opt.labelKey)}
            </Text>
          </TouchableOpacity>
        ))}
        <View style={s.sep} />
        <TouchableOpacity
          style={[s.chip, filters.onlyMine && s.chipActive]}
          onPress={() => onChange({ ...filters, onlyMine: !filters.onlyMine })}
        >
          <Text style={[s.chipText, filters.onlyMine && s.chipTextActive]}>
            👤 {i18n.t('filter.only_mine')}
          </Text>
        </TouchableOpacity>
        {hasActive && (
          <>
            <View style={s.sep} />
            <TouchableOpacity style={s.resetBtn} onPress={() => onChange(DEFAULT_FILTERS)}>
              <Text style={s.resetText}>✕ {i18n.t('filter.reset')}</Text>
            </TouchableOpacity>
          </>
        )}
      </ScrollView>

      {/* Row 2: Activities */}
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={s.row}>
        {ACTIVITIES.map(act => (
          <TouchableOpacity
            key={act.value}
            style={[s.chip, filters.activity === act.value && s.chipActive]}
            onPress={() => onChange({ ...filters, activity: act.value })}
          >
            <Text style={[s.chipText, filters.activity === act.value && s.chipTextActive]}>
              {act.icon} {i18n.t(act.labelKey)}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {/* Row 3: Colors */}
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={[s.row, s.colorRow]}>
        <TouchableOpacity
          style={[s.colorDot, s.colorDotAll, filters.color === null && s.colorDotActive]}
          onPress={() => onChange({ ...filters, color: null })}
        >
          <Text style={s.colorDotAllText}>✦</Text>
        </TouchableOpacity>
        {planColors.map(c => (
          <TouchableOpacity
            key={c}
            style={[s.colorDot, { backgroundColor: c }, filters.color === c && s.colorDotActive]}
            onPress={() => onChange({ ...filters, color: filters.color === c ? null : c })}
          />
        ))}
      </ScrollView>

      {/* Row 4: Gruppi */}
      {groups && groups.length > 0 && (
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={s.row}>
          <TouchableOpacity
            style={[s.chip, filters.groupId === null && s.chipActive]}
            onPress={() => onChange({ ...filters, groupId: null })}
          >
            <Text style={[s.chipText, filters.groupId === null && s.chipTextActive]}>{i18n.t('filter.all_groups')}</Text>
          </TouchableOpacity>
          {groups.map(g => (
            <TouchableOpacity
              key={g.id}
              style={[s.chip, filters.groupId === g.id && s.chipActive]}
              onPress={() => onChange({ ...filters, groupId: filters.groupId === g.id ? null : g.id })}
            >
              <Text style={[s.chipText, filters.groupId === g.id && s.chipTextActive]}>
                {g.name}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      )}
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
  colorDotAllText: { color: colors.textDim, ...font.tiny },
  colorDotActive: { borderColor: colors.white, transform: [{ scale: 1.25 }] },
})
