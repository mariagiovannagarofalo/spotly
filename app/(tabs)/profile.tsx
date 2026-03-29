import { decode } from 'base64-arraybuffer'
import * as ImagePicker from 'expo-image-picker'
import { useEffect, useState } from 'react'
import { ActivityIndicator, Alert, FlatList, Image, StyleSheet, Text, TouchableOpacity, View } from 'react-native'
import EditProfileModal from '../../components/profile/EditProfileModal'
import PlanCard from '../../components/feed/PlanCard'
import { supabase } from '../../lib/supabase'
import { colors, font, radii, spacing } from '../../lib/theme'
import { Plan, Profile } from '../../types'

export default function ProfileScreen() {
  const [profile, setProfile] = useState<Profile | null>(null)
  const [plans, setPlans] = useState<Plan[]>([])
  const [loading, setLoading] = useState(true)
  const [uploadingAvatar, setUploadingAvatar] = useState(false)
  const [editVisible, setEditVisible] = useState(false)
  const [userId, setUserId] = useState<string | null>(null)

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (user) {
        setUserId(user.id)
        fetchProfile(user.id)
        fetchMyPlans(user.id)
      }
    })
  }, [])

  async function fetchProfile(uid: string) {
    const { data } = await supabase.from('profiles').select('*').eq('id', uid).single()
    setProfile(data)
    setLoading(false)
  }

  async function fetchMyPlans(uid: string) {
    const { data } = await supabase
      .from('plans')
      .select('*, profiles (id, username, full_name), plan_participants (user_id)')
      .eq('user_id', uid)
      .order('created_at', { ascending: false })
    setPlans((data as Plan[]) || [])
  }

  async function handlePickAvatar() {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync()
    if (status !== 'granted') {
      Alert.alert('Permesso necessario', 'Consenti l\'accesso alla galleria nelle impostazioni.')
      return
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.7,
      base64: true,
    })

    if (result.canceled || !result.assets[0]) return

    setUploadingAvatar(true)
    const asset = result.assets[0]
    const ext = asset.uri.split('.').pop()?.toLowerCase() ?? 'jpg'
    const path = `${userId}/avatar.${ext}`

    if (!asset.base64) {
      Alert.alert('Errore', 'Impossibile leggere la foto.')
      setUploadingAvatar(false)
      return
    }

    const { error: uploadError } = await supabase.storage
      .from('avatars')
      .upload(path, decode(asset.base64), { contentType: `image/${ext}`, upsert: true })

    if (uploadError) {
      Alert.alert('Errore upload', uploadError.message)
      setUploadingAvatar(false)
      return
    }

    const { data: { publicUrl } } = supabase.storage.from('avatars').getPublicUrl(path)
    const avatarUrl = `${publicUrl}?t=${Date.now()}`

    await supabase.from('profiles').update({ avatar_url: avatarUrl }).eq('id', userId)
    setUploadingAvatar(false)
    fetchProfile(userId!)
  }

  async function handleJoin(planId: string) {
    if (!userId) return
    const plan = plans.find(p => p.id === planId)
    const alreadyJoined = plan?.plan_participants?.some(pp => pp.user_id === userId)
    if (alreadyJoined) {
      await supabase.from('plan_participants').delete().match({ plan_id: planId, user_id: userId })
    } else {
      await supabase.from('plan_participants').insert({ plan_id: planId, user_id: userId })
    }
    fetchMyPlans(userId)
  }

  async function handleLogout() {
    Alert.alert('Esci', "Vuoi uscire dall'account?", [
      { text: 'Annulla', style: 'cancel' },
      { text: 'Esci', style: 'destructive', onPress: () => supabase.auth.signOut() },
    ])
  }

  if (loading) {
    return (
      <View style={s.loadingContainer}>
        <ActivityIndicator color={colors.primary} />
      </View>
    )
  }

  const initial = (profile?.username ?? '?')[0].toUpperCase()

  return (
    <View style={s.container}>
      <FlatList
        data={plans}
        keyExtractor={item => item.id}
        ListHeaderComponent={
          <View>
            <View style={s.header}>
              <Text style={s.headerTitle}>profilo</Text>
              <TouchableOpacity onPress={handleLogout}>
                <Text style={s.logoutBtn}>Esci</Text>
              </TouchableOpacity>
            </View>

            <View style={s.profileSection}>
              <TouchableOpacity onPress={handlePickAvatar} style={s.avatarWrapper}>
                {uploadingAvatar ? (
                  <View style={s.avatar}>
                    <ActivityIndicator color={colors.white} />
                  </View>
                ) : profile?.avatar_url ? (
                  <Image source={{ uri: profile.avatar_url }} style={s.avatarImage} />
                ) : (
                  <View style={s.avatar}>
                    <Text style={s.avatarText}>{initial}</Text>
                  </View>
                )}
                <View style={s.cameraBadge}>
                  <Text style={s.cameraIcon}>📷</Text>
                </View>
              </TouchableOpacity>

              <View style={s.info}>
                <Text style={s.username}>@{profile?.username}</Text>
                {profile?.full_name ? <Text style={s.fullName}>{profile.full_name}</Text> : null}
                {profile?.bio ? <Text style={s.bio}>{profile.bio}</Text> : null}
              </View>
            </View>

            <TouchableOpacity style={s.editButton} onPress={() => setEditVisible(true)}>
              <Text style={s.editButtonText}>Modifica profilo</Text>
            </TouchableOpacity>

            <View style={s.divider} />
            <Text style={s.sectionTitle}>I miei piani ({plans.length})</Text>
          </View>
        }
        ListEmptyComponent={
          <View style={s.empty}>
            <Text style={s.emptyText}>Nessun piano ancora.</Text>
            <Text style={s.emptySubtext}>Creane uno dal Feed!</Text>
          </View>
        }
        renderItem={({ item }) => (
          <PlanCard plan={item} currentUserId={userId} onJoin={() => handleJoin(item.id)} />
        )}
        contentContainerStyle={{ paddingBottom: spacing.xxl }}
        showsVerticalScrollIndicator={false}
      />

      {profile && (
        <EditProfileModal
          visible={editVisible}
          onClose={() => setEditVisible(false)}
          onSaved={() => {
            setEditVisible(false)
            fetchProfile(userId!)
          }}
          initialValues={{
            username: profile.username,
            full_name: profile.full_name ?? '',
            bio: profile.bio ?? '',
          }}
        />
      )}
    </View>
  )
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg },
  loadingContainer: { flex: 1, backgroundColor: colors.bg, justifyContent: 'center', alignItems: 'center' },
  header: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingHorizontal: spacing.md, paddingTop: 60, paddingBottom: spacing.md,
  },
  headerTitle: { color: colors.white, ...font.logo },
  logoutBtn: { color: colors.textDim, ...font.label },
  profileSection: {
    flexDirection: 'row', alignItems: 'center',
    paddingHorizontal: spacing.md, gap: spacing.md, marginBottom: spacing.md,
  },
  avatarWrapper: { position: 'relative' },
  avatar: {
    width: 72, height: 72, borderRadius: 36,
    backgroundColor: colors.primary,
    justifyContent: 'center', alignItems: 'center',
  },
  avatarImage: {
    width: 72, height: 72, borderRadius: 36,
  },
  avatarText: { color: colors.white, fontSize: 28, fontWeight: '700' },
  cameraBadge: {
    position: 'absolute', bottom: 0, right: -4,
    backgroundColor: colors.card, borderRadius: 12,
    width: 24, height: 24, justifyContent: 'center', alignItems: 'center',
    borderWidth: 1, borderColor: colors.border,
  },
  cameraIcon: { fontSize: 12 },
  info: { flex: 1 },
  username: { color: colors.white, ...font.heading },
  fullName: { color: colors.textMuted, ...font.body, marginTop: 2 },
  bio: { color: colors.textDim, ...font.small, marginTop: 4 },
  editButton: {
    marginHorizontal: spacing.md, borderRadius: radii.md,
    borderWidth: 1, borderColor: colors.border,
    padding: spacing.sm + 2, alignItems: 'center',
  },
  editButtonText: { color: colors.textMuted, ...font.label },
  divider: {
    height: 1, backgroundColor: colors.border,
    marginHorizontal: spacing.md, marginVertical: spacing.md,
  },
  sectionTitle: {
    color: colors.textMuted, ...font.label,
    paddingHorizontal: spacing.md, marginBottom: spacing.xs,
  },
  empty: { paddingHorizontal: spacing.md, paddingTop: spacing.md },
  emptyText: { color: colors.white, ...font.heading },
  emptySubtext: { color: colors.textDim, ...font.label, marginTop: spacing.xs },
})
