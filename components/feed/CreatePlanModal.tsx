import { decode } from 'base64-arraybuffer'
import * as ImagePicker from 'expo-image-picker'
import { useEffect, useState } from 'react'
import {
  Alert, Image, KeyboardAvoidingView, Modal, Platform,
  ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View,
} from 'react-native'
import { Ionicons } from '@expo/vector-icons'
import DatePickerModal from '../shared/DatePickerModal'
import { geocode } from '../../lib/geocode'
import i18n from '../../lib/i18n'
import { supabase } from '../../lib/supabase'
import { colors, font, planColors, radii, spacing } from '../../lib/theme'
import { Group, Plan, Profile } from '../../types'
import FriendSearch from './FriendSearch'
import LocationSearch from './LocationSearch'

type Props = {
  visible: boolean
  onClose: () => void
  onCreated: () => void
  onDeleted?: () => void
  userId: string | null
  plan?: Plan
  userGroups?: Group[]
}

type Recurrence = 'none' | 'daily' | 'weekly' | 'monthly' | 'yearly'

function formatDisplayDate(iso: string): string {
  return new Date(iso + 'T12:00:00').toLocaleDateString(i18n.locale, {
    day: 'numeric', month: 'long', year: 'numeric',
  })
}

const TIMEZONES: { value: string; label: string; city: string }[] = [
  { value: 'Europe/Rome', label: 'CET', city: 'Roma' },
  { value: 'Europe/London', label: 'GMT', city: 'Londra' },
  { value: 'Europe/Paris', label: 'CET', city: 'Parigi' },
  { value: 'Europe/Berlin', label: 'CET', city: 'Berlino' },
  { value: 'Europe/Lisbon', label: 'WET', city: 'Lisbona' },
  { value: 'Europe/Athens', label: 'EET', city: 'Atene' },
  { value: 'Europe/Moscow', label: 'MSK', city: 'Mosca' },
  { value: 'Africa/Cairo', label: 'EET', city: 'Cairo' },
  { value: 'Africa/Lagos', label: 'WAT', city: 'Lagos' },
  { value: 'America/New_York', label: 'ET', city: 'New York' },
  { value: 'America/Chicago', label: 'CT', city: 'Chicago' },
  { value: 'America/Denver', label: 'MT', city: 'Denver' },
  { value: 'America/Los_Angeles', label: 'PT', city: 'Los Angeles' },
  { value: 'America/Sao_Paulo', label: 'BRT', city: 'São Paulo' },
  { value: 'America/Mexico_City', label: 'CST', city: 'Città del Messico' },
  { value: 'America/Buenos_Aires', label: 'ART', city: 'Buenos Aires' },
  { value: 'Asia/Dubai', label: 'GST', city: 'Dubai' },
  { value: 'Asia/Kolkata', label: 'IST', city: 'Mumbai' },
  { value: 'Asia/Bangkok', label: 'ICT', city: 'Bangkok' },
  { value: 'Asia/Shanghai', label: 'CST', city: 'Pechino' },
  { value: 'Asia/Tokyo', label: 'JST', city: 'Tokyo' },
  { value: 'Asia/Seoul', label: 'KST', city: 'Seoul' },
  { value: 'Asia/Singapore', label: 'SGT', city: 'Singapore' },
  { value: 'Australia/Sydney', label: 'AEST', city: 'Sydney' },
  { value: 'Pacific/Auckland', label: 'NZST', city: 'Auckland' },
  { value: 'UTC', label: 'UTC', city: 'UTC' },
]

const RECURRENCE_OPTIONS: { value: Recurrence; labelKey: string }[] = [
  { value: 'none', labelKey: 'recurrence.none' },
  { value: 'daily', labelKey: 'recurrence.daily' },
  { value: 'weekly', labelKey: 'recurrence.weekly' },
  { value: 'monthly', labelKey: 'recurrence.monthly' },
  { value: 'yearly', labelKey: 'recurrence.yearly' },
]

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

const VISIBILITY_OPTIONS = [
  { value: 'public', labelKey: 'plan.visibility_public', icon: '🌍' },
  { value: 'friends', labelKey: 'plan.visibility_friends', icon: '👥' },
  { value: 'groups', labelKey: 'plan.visibility_groups', icon: '🫂' },
  { value: 'private', labelKey: 'plan.visibility_private', icon: '🔒' },
]


export default function CreatePlanModal({ visible, onClose, onCreated, onDeleted, userId, plan, userGroups = [] }: Props) {
  const isEditing = !!plan
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [location, setLocation] = useState('')
  const [latitude, setLatitude] = useState<number | null>(null)
  const [longitude, setLongitude] = useState<number | null>(null)
  const [activity, setActivity] = useState('')
  const [color, setColor] = useState(planColors[0])
  const [startDate, setStartDate] = useState<string | null>(null)
  const [endDate, setEndDate] = useState<string | null>(null)
  const [pickerFor, setPickerFor] = useState<'start' | 'end' | null>(null)
  const [visibility, setVisibility] = useState('friends')
  const [selectedGroups, setSelectedGroups] = useState<Group[]>([])
  const [taggedFriends, setTaggedFriends] = useState<Profile[]>([])
  const [taggedGroupId, setTaggedGroupId] = useState<string | null>(null)
  const [allDay, setAllDay] = useState(true)
  const [startTime, setStartTime] = useState('')
  const [endTime, setEndTime] = useState('')
  const [timezone, setTimezone] = useState(() => Intl.DateTimeFormat().resolvedOptions().timeZone)
  const [recurrence, setRecurrence] = useState<Recurrence>('none')
  const [link, setLink] = useState('')
  const [photoUrl, setPhotoUrl] = useState<string | null>(null)
  const [photoUploading, setPhotoUploading] = useState(false)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (visible && plan) {
      setTitle(plan.title)
      setDescription(plan.description ?? '')
      setLocation(plan.location)
      setLatitude((plan as any).latitude ?? null)
      setLongitude((plan as any).longitude ?? null)
      setActivity(plan.activity ?? '')
      setColor(plan.color ?? planColors[0])
      setStartDate(plan.start_date ?? null)
      setEndDate(plan.end_date ?? null)
      setVisibility(plan.visibility)
      // ripristina i gruppi visibilità
      const planGroupIds = (plan.plan_groups ?? []).map(pg => pg.group_id)
      setSelectedGroups(userGroups.filter(g => planGroupIds.includes(g.id)))
      setAllDay(plan.all_day ?? true)
      setStartTime(plan.start_time ?? '')
      setEndTime(plan.end_time ?? '')
      setTimezone(plan.timezone ?? Intl.DateTimeFormat().resolvedOptions().timeZone)
      setRecurrence((plan.recurrence ?? 'none') as Recurrence)
      setLink(plan.link ?? '')
      setPhotoUrl(plan.photo_url ?? null)
    } else if (!visible) {
      reset()
    }
  }, [visible, plan?.id])

  async function fetchTimezoneForCoords(lat: number, lon: number) {
    try {
      const res = await fetch(
        `https://api.bigdatacloud.net/data/reverse-geocode-client?latitude=${lat}&longitude=${lon}&localityLanguage=en`
      )
      const data = await res.json()
      const tz = typeof data.timezone === 'string' ? data.timezone : data.timezone?.name
      if (tz) setTimezone(tz)
    } catch { /* lascia il timezone attuale */ }
  }

  async function pickPhoto() {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync()
    if (status !== 'granted') {
      Alert.alert(i18n.t('profile.permission_needed'), i18n.t('profile.permission_body'))
      return
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true, aspect: [16, 9], quality: 0.7, base64: true,
    })
    if (result.canceled || !result.assets[0]) return
    const asset = result.assets[0]
    if (!asset.base64) { Alert.alert(i18n.t('plan.error'), i18n.t('plan.photo_error')); return }
    setPhotoUploading(true)
    const ext = asset.uri.split('.').pop()?.toLowerCase() ?? 'jpg'
    const fileName = `plan-${Date.now()}.${ext}`
    const { data, error } = await supabase.storage
      .from('plan-photos')
      .upload(fileName, decode(asset.base64), { contentType: `image/${ext}`, upsert: true })
    if (error) { Alert.alert(i18n.t('plan.upload_error'), error.message); setPhotoUploading(false); return }
    const { data: urlData } = supabase.storage.from('plan-photos').getPublicUrl(data.path)
    setPhotoUrl(urlData.publicUrl)
    setPhotoUploading(false)
  }

  function reset() {
    setTitle(''); setDescription(''); setLocation('')
    setLatitude(null); setLongitude(null); setActivity('')
    setColor(planColors[0]); setStartDate(null); setEndDate(null)
    setVisibility('friends'); setSelectedGroups([]); setTaggedFriends([]); setTaggedGroupId(null)
    setAllDay(true); setStartTime(''); setEndTime('')
    setTimezone(Intl.DateTimeFormat().resolvedOptions().timeZone)
    setRecurrence('none'); setLink(''); setPhotoUrl(null)
  }

  async function handleSave() {
    if (!title.trim() || !location.trim()) {
      Alert.alert(i18n.t('plan.required_fields'), i18n.t('plan.required_body'))
      return
    }
    if (!startDate) {
      Alert.alert(i18n.t('plan.required_date'), i18n.t('plan.required_date_body'))
      return
    }

    setLoading(true)

    let lat = latitude
    let lon = longitude
    // In edit mode, if location text changed re-geocode to get fresh coordinates
    if (isEditing && location.trim() !== plan?.location) {
      lat = null
      lon = null
    }
    if ((lat === null || lon === null) && location.trim()) {
      const coords = await geocode(location.trim())
      if (coords) { lat = coords.latitude; lon = coords.longitude }
    }

    const payload = {
      title: title.trim(),
      description: description.trim() || null,
      location: location.trim(),
      activity: activity || null,
      color,
      start_date: startDate,
      end_date: endDate,
      visibility,
      latitude: lat,
      longitude: lon,
      all_day: allDay,
      start_time: allDay ? null : startTime || null,
      end_time: allDay ? null : endTime || null,
      timezone: allDay ? null : timezone,
      recurrence,
      link: link.trim() || null,
      photo_url: photoUrl,
    }

    // Recupera i membri del gruppo taggato (se presente)
    let groupMemberIds: string[] = []
    if (taggedGroupId) {
      const { data: gm } = await supabase
        .from('group_members')
        .select('user_id')
        .eq('group_id', taggedGroupId)
      groupMemberIds = (gm ?? []).map((m: any) => m.user_id).filter((id: string) => id !== userId)
    }

    if (isEditing) {
      const { error } = await supabase.from('plans').update(payload).eq('id', plan!.id)
      if (error) { Alert.alert(i18n.t('plan.error'), error.message); setLoading(false); return }
      // aggiorna plan_groups
      await supabase.from('plan_groups').delete().eq('plan_id', plan!.id)
      if (visibility === 'groups' && selectedGroups.length > 0) {
        await supabase.from('plan_groups').insert(
          selectedGroups.map(g => ({ plan_id: plan!.id, group_id: g.id }))
        )
      }
    } else {
      const { data: newPlan, error } = await supabase
        .from('plans').insert({ user_id: userId, ...payload }).select().single()
      if (error) { Alert.alert(i18n.t('plan.error'), error.message); setLoading(false); return }
      if (newPlan) {
        // partecipanti individuali + membri del gruppo taggato
        const allParticipants = [
          ...taggedFriends.map(f => f.id),
          ...groupMemberIds,
        ].filter((id, i, arr) => arr.indexOf(id) === i)
        if (allParticipants.length > 0) {
          await supabase.from('plan_participants').insert(
            allParticipants.map(uid => ({ plan_id: newPlan.id, user_id: uid }))
          )
        }
        // plan_groups per visibilità
        if (visibility === 'groups' && selectedGroups.length > 0) {
          await supabase.from('plan_groups').insert(
            selectedGroups.map(g => ({ plan_id: newPlan.id, group_id: g.id }))
          )
        }
      }
    }

    setLoading(false)
    reset()
    onCreated()
  }

  async function handleDelete() {
    if (!plan) return
    Alert.alert(i18n.t('plan.delete_confirm'), i18n.t('plan.delete_confirm_body'), [
      { text: i18n.t('plan.cancel'), style: 'cancel' },
      {
        text: i18n.t('plan.delete'), style: 'destructive', onPress: async () => {
          const { error } = await supabase.from('plans').delete().eq('id', plan.id)
          if (error) { Alert.alert(i18n.t('plan.error'), error.message); return }
          reset()
          onDeleted?.()
        }
      },
    ])
  }

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet" onRequestClose={onClose}>
      <KeyboardAvoidingView style={s.container} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
        <View style={s.handle} />

        <View style={s.headerRow}>
          <Text style={s.headerTitle}>{isEditing ? i18n.t('plan.edit_title') : i18n.t('plan.new_title')}</Text>
          <View style={s.headerActions}>
            {isEditing && (
              <TouchableOpacity onPress={handleDelete} style={s.deleteBtn}>
                <Text style={s.deleteBtnText}>🗑️</Text>
              </TouchableOpacity>
            )}
            <TouchableOpacity onPress={() => { reset(); onClose() }}>
              <Text style={s.cancelBtn}>{i18n.t('plan.cancel')}</Text>
            </TouchableOpacity>
          </View>
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
              fetchTimezoneForCoords(lat, lon)
            }}
          />

          <Text style={s.label}>{i18n.t('plan.color_label')}</Text>
          <View style={s.colorRow}>
            {planColors.map(c => (
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

          <Text style={s.label}>{i18n.t('plan.start_date')}</Text>
          <TouchableOpacity style={s.datePickerBtn} onPress={() => setPickerFor('start')}>
            <Text style={[s.datePickerText, !startDate && s.datePickerPlaceholder]}>
              {startDate ? formatDisplayDate(startDate) : i18n.t('plan.date_start_placeholder')}
            </Text>
            <Ionicons name="calendar-outline" size={18} color={colors.textDim} />
          </TouchableOpacity>

          <Text style={s.label}>{i18n.t('plan.end_date')}</Text>
          <TouchableOpacity style={s.datePickerBtn} onPress={() => setPickerFor('end')}>
            <Text style={[s.datePickerText, !endDate && s.datePickerPlaceholder]}>
              {endDate ? formatDisplayDate(endDate) : i18n.t('plan.date_end_placeholder')}
            </Text>
            <Ionicons name="calendar-outline" size={18} color={colors.textDim} />
          </TouchableOpacity>

          {/* Time */}
          <Text style={s.label}>{i18n.t('plan.time_label')}</Text>
          <View style={s.timeToggleRow}>
            <TouchableOpacity
              style={[s.timeToggleBtn, allDay && s.timeToggleBtnActive]}
              onPress={() => setAllDay(true)}
            >
              <Text style={[s.timeToggleText, allDay && s.timeToggleTextActive]}>{i18n.t('plan.all_day')}</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[s.timeToggleBtn, !allDay && s.timeToggleBtnActive]}
              onPress={() => setAllDay(false)}
            >
              <Text style={[s.timeToggleText, !allDay && s.timeToggleTextActive]}>{i18n.t('plan.specific_time')}</Text>
            </TouchableOpacity>
          </View>
          {!allDay && (
            <>
              <View style={s.timeInputRow}>
                <TextInput
                  style={[s.input, s.timeInput]}
                  placeholder="HH:MM"
                  placeholderTextColor={colors.textPlaceholder}
                  value={startTime}
                  onChangeText={setStartTime}
                  keyboardType="numbers-and-punctuation"
                  maxLength={5}
                />
                <Text style={s.timeSep}>→</Text>
                <TextInput
                  style={[s.input, s.timeInput]}
                  placeholder="HH:MM"
                  placeholderTextColor={colors.textPlaceholder}
                  value={endTime}
                  onChangeText={setEndTime}
                  keyboardType="numbers-and-punctuation"
                  maxLength={5}
                />
              </View>
              <Text style={[s.label, { marginTop: spacing.sm }]}>{i18n.t('plan.timezone_label')}</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} style={s.tzScroll}>
                {TIMEZONES.map(tz => {
                  const isActive = timezone === tz.value
                  return (
                    <TouchableOpacity
                      key={tz.value}
                      style={[s.tzBtn, isActive && s.tzBtnActive]}
                      onPress={() => setTimezone(tz.value)}
                    >
                      <Text style={[s.tzLabel, isActive && s.tzLabelActive]}>{tz.label}</Text>
                      <Text style={[s.tzCity, isActive && s.tzCityActive]}>{tz.city}</Text>
                    </TouchableOpacity>
                  )
                })}
              </ScrollView>
            </>
          )}

          {/* Recurrence */}
          <Text style={s.label}>{i18n.t('plan.repeat_label')}</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={s.recurrenceScroll}>
            {RECURRENCE_OPTIONS.map(opt => (
              <TouchableOpacity
                key={opt.value}
                style={[s.recurrenceBtn, recurrence === opt.value && s.recurrenceBtnActive]}
                onPress={() => setRecurrence(opt.value)}
              >
                <Text style={[s.recurrenceText, recurrence === opt.value && s.recurrenceTextActive]}>
                  {i18n.t(opt.labelKey)}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>

          <Text style={s.label}>{i18n.t('plan.friends_label')}</Text>
          <FriendSearch
            currentUserId={userId}
            selected={taggedFriends}
            onAdd={p => setTaggedFriends(prev => [...prev, p])}
            onRemove={id => setTaggedFriends(prev => prev.filter(p => p.id !== id))}
          />
          {userGroups.length > 0 && (
            <View style={s.groupTagRow}>
              <Text style={s.groupTagLabel}>{i18n.t('plan.tag_group_label')}</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                <View style={{ flexDirection: 'row', gap: spacing.xs }}>
                  {userGroups.map(g => (
                    <TouchableOpacity
                      key={g.id}
                      style={[s.groupTagChip, taggedGroupId === g.id && s.groupTagChipActive]}
                      onPress={() => setTaggedGroupId(taggedGroupId === g.id ? null : g.id)}
                    >
                      <Text style={[s.groupTagChipText, taggedGroupId === g.id && s.groupTagChipTextActive]}>
                        👥 {g.name}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </ScrollView>
            </View>
          )}

          {/* Photo */}
          <Text style={s.label}>{i18n.t('plan.photo_label')}</Text>
          {photoUrl ? (
            <View style={s.photoPreview}>
              <Image source={{ uri: photoUrl }} style={s.photoImg} />
              <TouchableOpacity style={s.photoRemove} onPress={() => setPhotoUrl(null)}>
                <Text style={s.photoRemoveText}>✕</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <TouchableOpacity style={s.photoBtn} onPress={pickPhoto} disabled={photoUploading}>
              <Text style={s.photoBtnText}>{photoUploading ? i18n.t('plan.photo_loading') : i18n.t('plan.photo_add')}</Text>
            </TouchableOpacity>
          )}

          {/* Link */}
          <Text style={s.label}>{i18n.t('plan.link_label')}</Text>
          <TextInput
            style={s.input}
            placeholder="https://..."
            placeholderTextColor={colors.textPlaceholder}
            value={link}
            onChangeText={setLink}
            keyboardType="url"
            autoCapitalize="none"
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
                  {i18n.t((opt as any).labelKey)}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          {visibility === 'groups' && userGroups.length > 0 && (
            <View style={s.groupVisSection}>
              <Text style={s.groupVisLabel}>{i18n.t('plan.group_visibility_pick')}</Text>
              {userGroups.map(g => {
                const isSelected = selectedGroups.some(sg => sg.id === g.id)
                return (
                  <TouchableOpacity
                    key={g.id}
                    style={[s.groupVisRow, isSelected && s.groupVisRowActive]}
                    onPress={() => setSelectedGroups(prev =>
                      isSelected ? prev.filter(sg => sg.id !== g.id) : [...prev, g]
                    )}
                  >
                    <Text style={s.groupVisName}>👥 {g.name}</Text>
                    <Text style={s.groupVisCheck}>{isSelected ? '✓' : ''}</Text>
                  </TouchableOpacity>
                )
              })}
            </View>
          )}
          {visibility === 'groups' && userGroups.length === 0 && (
            <Text style={s.groupVisEmpty}>{i18n.t('plan.group_visibility_empty')}</Text>
          )}

          <TouchableOpacity style={[s.createButton, { backgroundColor: color }]} onPress={handleSave} disabled={loading}>
            <Text style={s.createButtonText}>
              {loading ? '...' : isEditing ? i18n.t('plan.save_changes') : i18n.t('plan.create')}
            </Text>
          </TouchableOpacity>
        </ScrollView>

        <DatePickerModal
          visible={pickerFor !== null}
          value={pickerFor === 'start' ? startDate : endDate}
          onSelect={iso => {
            if (pickerFor === 'start') setStartDate(iso)
            else setEndDate(iso)
          }}
          onClose={() => setPickerFor(null)}
        />
      </KeyboardAvoidingView>
    </Modal>
  )
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg },
  handle: {
    width: 40, height: 4, backgroundColor: colors.dimmed,
    borderRadius: radii.xs, alignSelf: 'center', marginTop: spacing.sm + 4,
  },
  headerRow: {
    flexDirection: 'row', justifyContent: 'space-between',
    alignItems: 'center', paddingHorizontal: spacing.md, paddingVertical: spacing.md,
  },
  headerTitle: { color: colors.white, ...font.title },
  headerActions: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  deleteBtn: { padding: spacing.xs },
  deleteBtnText: { fontSize: 20 },
  cancelBtn: { color: colors.primary, ...font.body },
  form: { paddingHorizontal: spacing.md },
  label: { color: colors.textMuted, ...font.label, marginBottom: spacing.xs, marginTop: spacing.md },
  input: {
    backgroundColor: colors.input, borderRadius: radii.md, padding: spacing.sm + 6,
    ...font.body, color: colors.white, borderWidth: 1, borderColor: colors.inputBorder,
  },
  datePickerBtn: {
    backgroundColor: colors.input,
    borderRadius: radii.md,
    padding: spacing.sm + 6,
    borderWidth: 1,
    borderColor: colors.inputBorder,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  datePickerText: { ...font.body, color: colors.white },
  datePickerPlaceholder: { color: colors.textPlaceholder },
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
  timeToggleRow: { flexDirection: 'row', gap: spacing.sm, marginTop: spacing.xs },
  timeToggleBtn: {
    flex: 1, backgroundColor: colors.input, borderRadius: radii.md,
    padding: spacing.sm + 4, alignItems: 'center',
    borderWidth: 1, borderColor: colors.inputBorder,
  },
  timeToggleBtnActive: { borderColor: colors.primary, backgroundColor: colors.primaryDim },
  timeToggleText: { color: colors.textDim, ...font.small },
  timeToggleTextActive: { color: colors.primary, fontWeight: '700' },
  timeInputRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, marginTop: spacing.sm },
  timeInput: { flex: 1, textAlign: 'center' },
  timeSep: { color: colors.textMuted, ...font.body },
  tzScroll: { marginTop: spacing.xs },
  tzBtn: {
    backgroundColor: colors.input, borderRadius: radii.md,
    paddingHorizontal: spacing.sm + 4, paddingVertical: spacing.sm,
    marginRight: spacing.sm, borderWidth: 1, borderColor: colors.inputBorder,
    alignItems: 'center', minWidth: 72,
  },
  tzBtnActive: { borderColor: colors.primary, backgroundColor: colors.primaryDim },
  tzLabel: { color: colors.textMuted, ...font.label, fontWeight: '700' },
  tzLabelActive: { color: colors.primary },
  tzCity: { color: colors.textDim, fontSize: 10, marginTop: 2 },
  tzCityActive: { color: colors.primary },
  recurrenceScroll: { marginTop: spacing.xs },
  recurrenceBtn: {
    backgroundColor: colors.input, borderRadius: radii.pill,
    paddingHorizontal: spacing.md, paddingVertical: spacing.sm,
    marginRight: spacing.sm, borderWidth: 1, borderColor: colors.inputBorder,
  },
  recurrenceBtnActive: { borderColor: colors.primary, backgroundColor: colors.primaryDim },
  recurrenceText: { color: colors.textDim, ...font.small },
  recurrenceTextActive: { color: colors.primary, fontWeight: '700' },
  photoBtn: {
    backgroundColor: colors.input, borderRadius: radii.md,
    padding: spacing.md, alignItems: 'center',
    borderWidth: 1, borderColor: colors.inputBorder, borderStyle: 'dashed',
  },
  photoBtnText: { color: colors.textMuted, ...font.label },
  photoPreview: { position: 'relative', borderRadius: radii.md, overflow: 'hidden' },
  photoImg: { width: '100%', height: 180, borderRadius: radii.md },
  photoRemove: {
    position: 'absolute', top: spacing.sm, right: spacing.sm,
    backgroundColor: 'rgba(0,0,0,0.6)', borderRadius: radii.pill,
    width: 28, height: 28, justifyContent: 'center', alignItems: 'center',
  },
  photoRemoveText: { color: colors.white, fontSize: 14, fontWeight: '700' },
  groupTagRow: { marginTop: spacing.sm },
  groupTagLabel: { color: colors.textDim, ...font.small, marginBottom: spacing.xs },
  groupTagChip: {
    backgroundColor: colors.input, borderRadius: radii.pill,
    paddingHorizontal: spacing.sm + 4, paddingVertical: spacing.xs + 2,
    borderWidth: 1, borderColor: colors.inputBorder,
  },
  groupTagChipActive: { backgroundColor: colors.primaryDim, borderColor: colors.primary },
  groupTagChipText: { color: colors.textDim, ...font.small },
  groupTagChipTextActive: { color: colors.primary, fontWeight: '700' },
  groupVisSection: {
    marginTop: spacing.sm, backgroundColor: colors.input,
    borderRadius: radii.md, borderWidth: 1, borderColor: colors.inputBorder,
    overflow: 'hidden',
  },
  groupVisLabel: { color: colors.textMuted, ...font.small, padding: spacing.sm },
  groupVisRow: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: spacing.sm + 4, paddingVertical: spacing.sm,
    borderTopWidth: 1, borderTopColor: colors.border,
  },
  groupVisRowActive: { backgroundColor: colors.primaryDim },
  groupVisName: { color: colors.white, ...font.body },
  groupVisCheck: { color: colors.primary, ...font.heading },
  groupVisEmpty: { color: colors.textDim, ...font.small, marginTop: spacing.xs },
  createButton: {
    backgroundColor: colors.primary, borderRadius: radii.md + 2,
    padding: spacing.md, alignItems: 'center', marginTop: spacing.xl, marginBottom: spacing.xxl,
  },
  createButtonText: { color: colors.white, ...font.button },
})
