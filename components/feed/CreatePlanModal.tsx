import { useState } from 'react'
import {
  Alert, KeyboardAvoidingView, Modal, Platform,
  ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View,
} from 'react-native'
import i18n from '../../lib/i18n'
import { supabase } from '../../lib/supabase'
import { colors, font, radii, spacing } from '../../lib/theme'
import { Profile } from '../../types'
import FriendSearch from './FriendSearch'
import LocationSearch from './LocationSearch'

type Props = {
  visible: boolean
  onClose: () => void
  onCreated: () => void
  userId: string | null
}

type DateFields = { day: string; month: string; year: string }

const ACTIVITIES = [
  { value: 'viaggio', labelKey: 'plan.activity_travel', icon: '✈️' },
  { value: 'concerto', labelKey: 'plan.activity_concert', icon: '🎵' },
  { value: 'sport', labelKey: 'plan.activity_sport', icon: '🏃' },
  { value: 'cena', labelKey: 'plan.activity_dinner', icon: '🍽️' },
  { value: 'festa', labelKey: 'plan.activity_party', icon: '🎉' },
  { value: 'natura', labelKey: 'plan.activity_nature', icon: '🌿' },
  { value: 'arte', labelKey: 'plan.activity_art', icon: '🎨' },
  { value: 'altro', labelKey: 'plan.activity_other', icon: '📌' },
]

const PLAN_COLORS = [
  '#6C63FF', '#FF6584', '#43C6AC', '#F7971E',
  '#4facfe', '#43e97b', '#fa709a', '#fee140',
]

const VISIBILITY_OPTIONS = [
  { value: 'public', label: 'Tutti', icon: '🌍' },
  { value: 'friends', label: 'Amici', icon: '👥' },
  { value: 'private', label: 'Solo io', icon: '🔒' },
]

function toISO({ day, month, year }: DateFields): string | null {
  if (!day || !month || !year) return null
  return `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`
}

function DateInput({ label, value, onChange }: {
  label: string; value: DateFields; onChange: (v: DateFields) => void
}) {
  return (
    <View>
      <Text style={s.label}>{label}</Text>
      <View style={s.dateRow}>
        <TextInput style={[s.input, s.dateDay]} placeholder="GG"
          placeholderTextColor={colors.textPlaceholder} keyboardType="number-pad"
          maxLength={2} value={value.day} onChangeText={day => onChange({ ...value, day })} />
        <TextInput style={[s.input, s.dateMonth]} placeholder="MM"
          placeholderTextColor={colors.textPlaceholder} keyboardType="number-pad"
          maxLength={2} value={value.month} onChangeText={month => onChange({ ...value, month })} />
        <TextInput style={[s.input, s.dateYear]} placeholder="AAAA"
          placeholderTextColor={colors.textPlaceholder} keyboardType="number-pad"
          maxLength={4} value={value.year} onChangeText={year => onChange({ ...value, year })} />
      </View>
    </View>
  )
}

const emptyDate = (): DateFields => ({ day: '', month: '', year: '' })

export default function CreatePlanModal({ visible, onClose, onCreated, userId }: Props) {
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [location, setLocation] = useState('')
  const [latitude, setLatitude] = useState<number | null>(null)
  const [longitude, setLongitude] = useState<number | null>(null)
  const [activity, setActivity] = useState('')
  const [color, setColor] = useState(PLAN_COLORS[0])
  const [startDate, setStartDate] = useState<DateFields>(emptyDate())
  const [endDate, setEndDate] = useState<DateFields>(emptyDate())
  const [visibility, setVisibility] = useState('friends')
  const [taggedFriends, setTaggedFriends] = useState<Profile[]>([])
  const [loading, setLoading] = useState(false)

  function reset() {
    setTitle(''); setDescription(''); setLocation('')
    setLatitude(null); setLongitude(null); setActivity('')
    setColor(PLAN_COLORS[0]); setStartDate(emptyDate()); setEndDate(emptyDate())
    setVisibility('friends'); setTaggedFriends([])
  }

  async function handleCreate() {
    if (!title.trim() || !location.trim()) {
      Alert.alert('Campi obbligatori', 'Inserisci titolo e location.')
      return
    }
    const start = toISO(startDate)
    if (!start) {
      Alert.alert('Data obbligatoria', 'Inserisci giorno, mese e anno di inizio.')
      return
    }

    setLoading(true)
    const { data: plan, error } = await supabase
      .from('plans')
      .insert({
        user_id: userId,
        title: title.trim(),
        description: description.trim() || null,
        location: location.trim(),
        activity: activity || null,
        color,
        start_date: start,
        end_date: toISO(endDate),
        visibility,
        latitude,
        longitude,
      })
      .select()
      .single()

    if (error) {
      Alert.alert('Errore', error.message)
      setLoading(false)
      return
    }

    // Aggiungi amici taggati come partecipanti
    if (taggedFriends.length > 0 && plan) {
      await supabase.from('plan_participants').insert(
        taggedFriends.map(f => ({ plan_id: plan.id, user_id: f.id }))
      )
    }

    setLoading(false)
    reset()
    onCreated()
  }

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet" onRequestClose={onClose}>
      <KeyboardAvoidingView style={s.container} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
        <View style={s.handle} />

        <View style={s.headerRow}>
          <Text style={s.headerTitle}>{i18n.t('plan.new_title')}</Text>
          <TouchableOpacity onPress={() => { reset(); onClose() }}>
            <Text style={s.cancelBtn}>{i18n.t('plan.cancel')}</Text>
          </TouchableOpacity>
        </View>

        <ScrollView style={s.form} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
          <Text style={s.label}>{i18n.t('plan.title_label')}</Text>
          <TextInput style={s.input} placeholder={i18n.t('plan.title_placeholder')}
            placeholderTextColor={colors.textPlaceholder} value={title} onChangeText={setTitle} />

          <Text style={s.label}>{i18n.t('plan.location_label')}</Text>
          <LocationSearch
            value={location}
            onSelect={(name, lat, lon) => {
              setLocation(name)
              setLatitude(lat)
              setLongitude(lon)
            }}
          />

          <Text style={s.label}>{i18n.t('plan.color_label')}</Text>
          <View style={s.colorRow}>
            {PLAN_COLORS.map(c => (
              <TouchableOpacity
                key={c}
                style={[s.colorCircle, { backgroundColor: c }, color === c && s.colorCircleActive]}
                onPress={() => setColor(c)}
              />
            ))}
          </View>

          <Text style={s.label}>{i18n.t('plan.activity_label')}</Text>
          <View style={s.activitiesGrid}>
            {ACTIVITIES.map(act => (
              <TouchableOpacity
                key={act.value}
                style={[s.actOption, activity === act.value && s.actOptionActive, activity === act.value && { borderColor: color }]}
                onPress={() => setActivity(activity === act.value ? '' : act.value)}
              >
                <Text style={s.actIcon}>{act.icon}</Text>
                <Text style={[s.actLabel, activity === act.value && { color }]}>
                  {i18n.t(act.labelKey)}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          <DateInput label={i18n.t('plan.start_date')} value={startDate} onChange={setStartDate} />
          <DateInput label={i18n.t('plan.end_date')} value={endDate} onChange={setEndDate} />

          <Text style={s.label}>{i18n.t('plan.friends_label')}</Text>
          <FriendSearch
            currentUserId={userId}
            selected={taggedFriends}
            onAdd={p => setTaggedFriends(prev => [...prev, p])}
            onRemove={id => setTaggedFriends(prev => prev.filter(p => p.id !== id))}
          />

          <Text style={s.label}>{i18n.t('plan.description_label')}</Text>
          <TextInput style={[s.input, s.textArea]} placeholder={i18n.t('plan.description_placeholder')}
            placeholderTextColor={colors.textPlaceholder} value={description}
            onChangeText={setDescription} multiline numberOfLines={3} />

          <Text style={s.label}>{i18n.t('plan.visibility_label')}</Text>
          <View style={s.visibilityRow}>
            {VISIBILITY_OPTIONS.map(opt => (
              <TouchableOpacity
                key={opt.value}
                style={[s.visOption, visibility === opt.value && s.visOptionActive]}
                onPress={() => setVisibility(opt.value)}
              >
                <Text style={s.visIcon}>{opt.icon}</Text>
                <Text style={[s.visLabel, visibility === opt.value && s.visLabelActive]}>
                  {opt.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          <TouchableOpacity style={[s.createButton, { backgroundColor: color }]} onPress={handleCreate} disabled={loading}>
            <Text style={s.createButtonText}>{loading ? i18n.t('plan.creating') : i18n.t('plan.create')}</Text>
          </TouchableOpacity>
        </ScrollView>
      </KeyboardAvoidingView>
    </Modal>
  )
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg },
  handle: {
    width: 40, height: 4, backgroundColor: '#333',
    borderRadius: 2, alignSelf: 'center', marginTop: spacing.sm + 4,
  },
  headerRow: {
    flexDirection: 'row', justifyContent: 'space-between',
    alignItems: 'center', paddingHorizontal: spacing.md, paddingVertical: spacing.md,
  },
  headerTitle: { color: colors.white, ...font.title },
  cancelBtn: { color: colors.primary, ...font.body },
  form: { paddingHorizontal: spacing.md },
  label: { color: colors.textMuted, ...font.label, marginBottom: spacing.xs, marginTop: spacing.md },
  input: {
    backgroundColor: colors.input, borderRadius: radii.md, padding: spacing.sm + 6,
    ...font.body, color: colors.white, borderWidth: 1, borderColor: colors.inputBorder,
  },
  dateRow: { flexDirection: 'row', gap: spacing.sm },
  dateDay: { width: 60, textAlign: 'center' },
  dateMonth: { width: 60, textAlign: 'center' },
  dateYear: { flex: 1, textAlign: 'center' },
  textArea: { height: 80, textAlignVertical: 'top' },
  activitiesGrid: {
    flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm, marginTop: spacing.xs,
  },
  actOption: {
    width: '22%', backgroundColor: colors.input, borderRadius: radii.md,
    padding: spacing.sm, alignItems: 'center', borderWidth: 1, borderColor: colors.inputBorder,
  },
  actOptionActive: { borderColor: colors.primary, backgroundColor: colors.primaryDim },
  actIcon: { fontSize: 22, marginBottom: spacing.xs },
  actLabel: { color: colors.textDim, fontSize: 10, textAlign: 'center' },
  actLabelActive: { color: colors.primary },
  colorRow: { flexDirection: 'row', gap: spacing.sm, marginTop: spacing.xs },
  colorCircle: {
    width: 32, height: 32, borderRadius: 16,
  },
  colorCircleActive: {
    borderWidth: 3, borderColor: colors.white,
    transform: [{ scale: 1.15 }],
  },
  visibilityRow: { flexDirection: 'row', gap: spacing.sm + 2, marginTop: spacing.xs },
  visOption: {
    flex: 1, backgroundColor: colors.input, borderRadius: radii.md,
    padding: spacing.sm + 4, alignItems: 'center', borderWidth: 1, borderColor: colors.inputBorder,
  },
  visOptionActive: { borderColor: colors.primary, backgroundColor: colors.primaryDim },
  visIcon: { fontSize: 20, marginBottom: spacing.xs },
  visLabel: { color: colors.textDim, ...font.small },
  visLabelActive: { color: colors.primary },
  createButton: {
    backgroundColor: colors.primary, borderRadius: radii.md + 2,
    padding: spacing.md, alignItems: 'center', marginTop: spacing.xl, marginBottom: spacing.xxl,
  },
  createButtonText: { color: colors.white, ...font.button },
})
