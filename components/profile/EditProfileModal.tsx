import { useState } from 'react'
import {
  Alert, KeyboardAvoidingView, Modal, Platform,
  ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View,
} from 'react-native'
import { supabase } from '../../lib/supabase'
import { colors, font, radii, spacing } from '../../lib/theme'

type Props = {
  visible: boolean
  onClose: () => void
  onSaved: () => void
  initialValues: { username: string; full_name: string; bio: string }
}

export default function EditProfileModal({ visible, onClose, onSaved, initialValues }: Props) {
  const [username, setUsername] = useState(initialValues.username)
  const [fullName, setFullName] = useState(initialValues.full_name)
  const [bio, setBio] = useState(initialValues.bio)
  const [loading, setLoading] = useState(false)

  async function handleSave() {
    if (!username.trim()) {
      Alert.alert('Username obbligatorio', 'Inserisci uno username.')
      return
    }

    setLoading(true)
    const { data: { user } } = await supabase.auth.getUser()
    const { error } = await supabase
      .from('profiles')
      .update({
        username: username.trim().toLowerCase(),
        full_name: fullName.trim(),
        bio: bio.trim() || null,
      })
      .eq('id', user!.id)
    setLoading(false)

    if (error) {
      Alert.alert('Errore', error.message)
    } else {
      onSaved()
    }
  }

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet" onRequestClose={onClose}>
      <KeyboardAvoidingView style={s.container} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
        <View style={s.handle} />

        <View style={s.headerRow}>
          <Text style={s.headerTitle}>Modifica Profilo</Text>
          <TouchableOpacity onPress={onClose}>
            <Text style={s.cancelBtn}>Annulla</Text>
          </TouchableOpacity>
        </View>

        <ScrollView style={s.form} showsVerticalScrollIndicator={false}>
          <Text style={s.label}>Username *</Text>
          <TextInput style={s.input} placeholder="il_tuo_username"
            placeholderTextColor={colors.textPlaceholder}
            value={username} onChangeText={setUsername}
            autoCapitalize="none" autoCorrect={false} />

          <Text style={s.label}>Nome completo</Text>
          <TextInput style={s.input} placeholder="Il tuo nome"
            placeholderTextColor={colors.textPlaceholder}
            value={fullName} onChangeText={setFullName} />

          <Text style={s.label}>Bio</Text>
          <TextInput style={[s.input, s.textArea]}
            placeholder="Raccontati in poche parole..."
            placeholderTextColor={colors.textPlaceholder}
            value={bio} onChangeText={setBio}
            multiline numberOfLines={3} />

          <TouchableOpacity style={s.saveButton} onPress={handleSave} disabled={loading}>
            <Text style={s.saveButtonText}>{loading ? 'Salvataggio...' : 'Salva'}</Text>
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
  textArea: { height: 80, textAlignVertical: 'top' },
  saveButton: {
    backgroundColor: colors.primary, borderRadius: radii.md,
    padding: spacing.md, alignItems: 'center', marginTop: spacing.xl, marginBottom: spacing.xxl,
  },
  saveButtonText: { color: colors.white, ...font.button },
})
