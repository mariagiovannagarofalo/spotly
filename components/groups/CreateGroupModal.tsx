import { useEffect, useState } from 'react'
import {
  ActivityIndicator, Alert, KeyboardAvoidingView, Modal, Platform,
  ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View,
} from 'react-native'
import { useRouter } from 'expo-router'
import i18n from '../../lib/i18n'
import { supabase } from '../../lib/supabase'
import { colors, font, radii, spacing } from '../../lib/theme'
import { Group, Profile } from '../../types'

type Props = {
  visible: boolean
  onClose: () => void
  onCreated: (group: Group) => void
  userId: string | null
  group?: Group        // se presente → modalità modifica
  openChatAfter?: boolean
}

export default function CreateGroupModal({ visible, onClose, onCreated, userId, group, openChatAfter }: Props) {
  const isEditing = !!group
  const router = useRouter()

  const [name, setName] = useState('')
  const [query, setQuery] = useState('')
  const [searchResults, setSearchResults] = useState<Profile[]>([])
  const [members, setMembers] = useState<Profile[]>([])
  const [searching, setSearching] = useState(false)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (visible && group) {
      setName(group.name)
      // carica i membri esistenti
      const existing = (group.group_members ?? []).map(gm => gm.profiles).filter(Boolean) as Profile[]
      setMembers(existing)
    } else if (!visible) {
      reset()
    }
  }, [visible, group?.id])

  function reset() {
    setName('')
    setQuery('')
    setSearchResults([])
    setMembers([])
  }

  async function searchUsers(text: string) {
    setQuery(text)
    if (text.length < 2) { setSearchResults([]); return }
    setSearching(true)
    const { data } = await supabase
      .from('profiles')
      .select('*')
      .ilike('username', `%${text}%`)
      .neq('id', userId)
      .limit(5)
    setSearchResults((data as Profile[]) || [])
    setSearching(false)
  }

  function addMember(profile: Profile) {
    if (members.find(m => m.id === profile.id)) return
    setMembers(prev => [...prev, profile])
    setQuery('')
    setSearchResults([])
  }

  function removeMember(id: string) {
    setMembers(prev => prev.filter(m => m.id !== id))
  }

  async function handleSave() {
    if (!name.trim()) {
      Alert.alert(i18n.t('group.name_required'), i18n.t('group.name_required_body'))
      return
    }
    setLoading(true)

    if (isEditing) {
      await supabase.from('groups').update({ name: name.trim() }).eq('id', group!.id)
      // aggiorna membri: rimuovi tutti e reinserisci
      await supabase.from('group_members').delete().eq('group_id', group!.id)
      if (members.length > 0) {
        await supabase.from('group_members').insert(
          members.map(m => ({ group_id: group!.id, user_id: m.id }))
        )
      }
      // aggiungi sempre il proprietario
      await supabase.from('group_members').upsert({ group_id: group!.id, user_id: userId })
      const updated: Group = { ...group!, name: name.trim(), group_members: members.map(m => ({ user_id: m.id, profiles: m })) }
      setLoading(false)
      reset()
      onCreated(updated)
    } else {
      const { data: newGroup, error } = await supabase
        .from('groups')
        .insert({ owner_id: userId, name: name.trim() })
        .select()
        .single()

      if (error || !newGroup) {
        Alert.alert(i18n.t('group.error'), error?.message ?? i18n.t('group.error_create'))
        setLoading(false)
        return
      }

      // aggiungi il proprietario + i membri selezionati
      const allMembers = [userId, ...members.map(m => m.id)]
      await supabase.from('group_members').insert(
        allMembers.map(uid => ({ group_id: newGroup.id, user_id: uid }))
      )

      const created: Group = {
        ...newGroup,
        group_members: members.map(m => ({ user_id: m.id, profiles: m })),
      }
      setLoading(false)
      reset()
      onCreated(created)

      if (openChatAfter) {
        onClose()
        router.push(`/chat/group/${newGroup.id}`)
      }
    }
  }

  async function handleDelete() {
    if (!group) return
    Alert.alert(i18n.t('group.delete_title'), i18n.t('group.delete_body'), [
      { text: i18n.t('group.cancel'), style: 'cancel' },
      {
        text: 'Elimina', style: 'destructive', onPress: async () => {
          await supabase.from('groups').delete().eq('id', group.id)
          reset()
          onClose()
        }
      },
    ])
  }

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet" onRequestClose={onClose}>
      <KeyboardAvoidingView style={s.container} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
        <View style={s.handle} />

        <View style={s.headerRow}>
          <Text style={s.headerTitle}>{isEditing ? i18n.t('group.edit_title') : i18n.t('group.new_title')}</Text>
          <View style={s.headerActions}>
            {isEditing && (
              <TouchableOpacity onPress={handleDelete} style={s.deleteBtn}>
                <Text style={s.deleteBtnText}>🗑️</Text>
              </TouchableOpacity>
            )}
            <TouchableOpacity onPress={() => { reset(); onClose() }}>
              <Text style={s.cancelBtn}>{i18n.t('group.cancel')}</Text>
            </TouchableOpacity>
          </View>
        </View>

        <ScrollView style={s.form} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
          <Text style={s.label}>{i18n.t('group.name_label')}</Text>
          <TextInput
            style={s.input}
            placeholder={i18n.t('group.name_placeholder')}
            placeholderTextColor={colors.textPlaceholder}
            value={name}
            onChangeText={setName}
          />

          <Text style={s.label}>{i18n.t('group.members_label')}</Text>

          {members.length > 0 && (
            <View style={s.memberTags}>
              {members.map(m => (
                <View key={m.id} style={s.tag}>
                  <Text style={s.tagText}>@{m.username}</Text>
                  <TouchableOpacity onPress={() => removeMember(m.id)}>
                    <Text style={s.tagRemove}>✕</Text>
                  </TouchableOpacity>
                </View>
              ))}
            </View>
          )}

          <View style={s.searchRow}>
            <TextInput
              style={s.input}
              placeholder={i18n.t('group.search_placeholder')}
              placeholderTextColor={colors.textPlaceholder}
              value={query}
              onChangeText={searchUsers}
              autoCapitalize="none"
              autoCorrect={false}
            />
            {searching && <ActivityIndicator color={colors.primary} style={s.spinner} />}
          </View>

          {searchResults.length > 0 && (
            <View style={s.dropdown}>
              {searchResults.map((item, i) => (
                <TouchableOpacity
                  key={item.id}
                  style={[s.result, i < searchResults.length - 1 && s.resultBorder]}
                  onPress={() => addMember(item)}
                >
                  <View style={s.avatar}>
                    <Text style={s.avatarText}>{item.username[0].toUpperCase()}</Text>
                  </View>
                  <View>
                    <Text style={s.resultUsername}>@{item.username}</Text>
                    {item.full_name ? <Text style={s.resultName}>{item.full_name}</Text> : null}
                  </View>
                </TouchableOpacity>
              ))}
            </View>
          )}

          {members.length > 0 && (
            <Text style={s.memberCount}>
              {i18n.t(members.length === 1 ? 'group.member_count_one' : 'group.member_count_other', { count: members.length })}
            </Text>
          )}

          <TouchableOpacity
            style={[s.createButton, loading && { opacity: 0.6 }]}
            onPress={handleSave}
            disabled={loading}
          >
            <Text style={s.createButtonText}>
              {loading ? '...' : isEditing ? i18n.t('group.save_changes') : openChatAfter ? i18n.t('group.create_chat') : i18n.t('group.create')}
            </Text>
          </TouchableOpacity>
        </ScrollView>
      </KeyboardAvoidingView>
    </Modal>
  )
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg },
  handle: {
    width: 40, height: 4, backgroundColor: colors.dimmed,
    borderRadius: 2, alignSelf: 'center', marginTop: spacing.sm + 4,
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
  memberTags: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.xs, marginBottom: spacing.sm },
  tag: {
    flexDirection: 'row', alignItems: 'center', gap: spacing.xs,
    backgroundColor: colors.primaryDim, borderRadius: radii.pill,
    paddingHorizontal: spacing.sm + 2, paddingVertical: spacing.xs,
    borderWidth: 1, borderColor: colors.primary,
  },
  tagText: { color: colors.primary, ...font.small },
  tagRemove: { color: colors.primary, fontSize: 12 },
  searchRow: { flexDirection: 'row', alignItems: 'center' },
  spinner: { position: 'absolute', right: spacing.sm },
  dropdown: {
    backgroundColor: colors.card, borderRadius: radii.md,
    borderWidth: 1, borderColor: colors.border, marginTop: spacing.xs,
  },
  result: { flexDirection: 'row', alignItems: 'center', padding: spacing.sm + 2, gap: spacing.sm },
  resultBorder: { borderBottomWidth: 1, borderBottomColor: colors.border },
  avatar: {
    width: 32, height: 32, borderRadius: 16,
    backgroundColor: colors.primary, justifyContent: 'center', alignItems: 'center',
  },
  avatarText: { color: colors.white, ...font.label },
  resultUsername: { color: colors.white, ...font.label },
  resultName: { color: colors.textDim, ...font.small },
  memberCount: { color: colors.textDim, ...font.small, marginTop: spacing.sm },
  createButton: {
    backgroundColor: colors.primary, borderRadius: radii.md + 2,
    padding: spacing.md, alignItems: 'center', marginTop: spacing.xl, marginBottom: spacing.xxl,
  },
  createButtonText: { color: colors.white, ...font.button },
})
