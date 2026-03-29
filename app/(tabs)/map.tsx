import * as Location from 'expo-location'
import { useEffect, useRef, useState } from 'react'
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native'
import MapView, { Callout, Marker, Region } from 'react-native-maps'
import FilterBar, { DEFAULT_FILTERS, PlanFilters } from '../../components/shared/FilterBar'
import SearchBar from '../../components/shared/SearchBar'
import CreatePlanModal from '../../components/feed/CreatePlanModal'
import { filterPlans } from '../../lib/filterPlans'
import i18n from '../../lib/i18n'
import { supabase } from '../../lib/supabase'
import { colors, font, radii, spacing } from '../../lib/theme'
import { Plan } from '../../types'

const INITIAL_REGION: Region = {
  latitude: 45.0, longitude: 12.0,
  latitudeDelta: 30, longitudeDelta: 30,
}

export default function MapScreen() {
  const [plans, setPlans] = useState<Plan[]>([])
  const [filters, setFilters] = useState<PlanFilters>(DEFAULT_FILTERS)
  const [searchQuery, setSearchQuery] = useState('')
  const [modalVisible, setModalVisible] = useState(false)
  const [userId, setUserId] = useState<string | null>(null)
  const mapRef = useRef<MapView>(null)

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (user) setUserId(user.id)
    })
    fetchPlans()
    locateUser()
  }, [])

  async function locateUser() {
    const { status } = await Location.requestForegroundPermissionsAsync()
    if (status !== 'granted') return
    const loc = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced })
    mapRef.current?.animateToRegion({
      latitude: loc.coords.latitude,
      longitude: loc.coords.longitude,
      latitudeDelta: 0.15,
      longitudeDelta: 0.15,
    }, 800)
  }

  async function fetchPlans() {
    const { data } = await supabase
      .from('plans')
      .select('*, profiles (id, username, full_name, avatar_url), plan_participants (user_id)')
      .not('latitude', 'is', null)
      .not('longitude', 'is', null)
    setPlans((data as Plan[]) || [])
  }

  function formatDate(date: string) {
    return new Date(date).toLocaleDateString(i18n.locale, { day: 'numeric', month: 'short' })
  }

  return (
    <View style={s.container}>
      <MapView ref={mapRef} style={s.map} initialRegion={INITIAL_REGION}
        mapType="mutedStandard" showsUserLocation>
        {filterPlans(plans, filters, userId, searchQuery).map(plan => (
          <Marker
            key={plan.id}
            coordinate={{ latitude: (plan as any).latitude, longitude: (plan as any).longitude }}
          >
            <View style={[s.pin, { backgroundColor: plan.color ?? colors.primary }]}>
              <Text style={s.pinText}>📍</Text>
            </View>
            <Callout style={s.callout}>
              <View style={s.calloutInner}>
                <Text style={s.calloutUsername}>@{plan.profiles?.username}</Text>
                <Text style={s.calloutTitle}>{plan.title}</Text>
                <Text style={s.calloutLocation}>{plan.location}</Text>
                <Text style={s.calloutDate}>{formatDate(plan.start_date)}</Text>
              </View>
            </Callout>
          </Marker>
        ))}
      </MapView>

      <View style={s.header}>
        <Text style={s.logo}>{i18n.t('map.title')}</Text>
        <View style={s.headerRight}>
          <TouchableOpacity style={s.newButton} onPress={() => setModalVisible(true)}>
            <Text style={s.newButtonText}>{i18n.t('feed.new_plan')}</Text>
          </TouchableOpacity>
          <TouchableOpacity style={s.locateBtn} onPress={locateUser}>
            <Text style={s.locateText}>◎</Text>
          </TouchableOpacity>
          <TouchableOpacity style={s.refreshBtn} onPress={fetchPlans}>
            <Text style={s.refreshText}>↻</Text>
          </TouchableOpacity>
        </View>
      </View>

      <View style={s.searchOverlay}>
        <SearchBar value={searchQuery} onChange={setSearchQuery} dark />
        <FilterBar filters={filters} onChange={setFilters} dark />
      </View>

      {plans.length === 0 && (
        <View style={s.empty}>
          <Text style={s.emptyText}>{i18n.t('map.no_plans')}</Text>
          <Text style={s.emptySubtext}>{i18n.t('map.create_from_feed')}</Text>
        </View>
      )}

      <CreatePlanModal
        visible={modalVisible}
        onClose={() => setModalVisible(false)}
        onCreated={() => { setModalVisible(false); fetchPlans() }}
        userId={userId}
      />
    </View>
  )
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg },
  map: { flex: 1 },
  header: {
    position: 'absolute', top: 60, left: spacing.md, right: spacing.md,
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
  },
  logo: {
    color: colors.white, ...font.logo,
    backgroundColor: 'rgba(0,0,0,0.6)',
    paddingHorizontal: spacing.sm + 4, paddingVertical: spacing.xs,
    borderRadius: radii.pill,
  },
  headerRight: { flexDirection: 'row', gap: spacing.sm, alignItems: 'center' },
  newButton: {
    backgroundColor: colors.primary, borderRadius: radii.pill,
    paddingHorizontal: spacing.md, paddingVertical: spacing.sm,
  },
  newButtonText: { color: colors.white, ...font.buttonSm },
  locateBtn: {
    backgroundColor: 'rgba(0,0,0,0.6)', borderRadius: radii.pill,
    width: 40, height: 40, justifyContent: 'center', alignItems: 'center',
  },
  locateText: { color: colors.white, fontSize: 22 },
  refreshBtn: {
    backgroundColor: 'rgba(0,0,0,0.6)', borderRadius: radii.pill,
    width: 40, height: 40, justifyContent: 'center', alignItems: 'center',
  },
  refreshText: { color: colors.white, fontSize: 20 },
  pin: {
    width: 36, height: 36, borderRadius: 18,
    justifyContent: 'center', alignItems: 'center',
  },
  pinText: { fontSize: 18 },
  callout: { width: 200 },
  calloutInner: { padding: spacing.sm, gap: 2 },
  calloutUsername: { color: colors.textSecondary, ...font.small },
  calloutTitle: { ...font.label, fontWeight: '700', color: colors.black },
  calloutLocation: { color: colors.primary, ...font.label },
  calloutDate: { color: colors.textSecondary, ...font.small },
  empty: {
    position: 'absolute', bottom: 100, left: spacing.md, right: spacing.md,
    backgroundColor: 'rgba(0,0,0,0.7)', borderRadius: radii.md,
    padding: spacing.md, alignItems: 'center',
  },
  emptyText: { color: colors.white, ...font.label },
  emptySubtext: { color: colors.textDim, ...font.small, marginTop: spacing.xs },
  searchOverlay: {
    position: 'absolute', top: 120, left: 0, right: 0, zIndex: 10,
  },
})
