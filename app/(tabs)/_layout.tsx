import { Ionicons } from '@expo/vector-icons'
import { Tabs } from 'expo-router'
import { colors, font } from '../../lib/theme'

type IconName = React.ComponentProps<typeof Ionicons>['name']

function tabIcon(active: IconName, inactive: IconName) {
  return ({ color, focused }: { color: string; focused: boolean }) => (
    <Ionicons name={focused ? active : inactive} size={24} color={color} />
  )
}

export default function TabLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarStyle: {
          backgroundColor: colors.bg,
          borderTopColor: colors.border,
        },
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.textDim,
        tabBarLabelStyle: { ...font.micro, fontWeight: '500' },
      }}
    >
      <Tabs.Screen
        name="feed"
        options={{
          title: 'Feed',
          tabBarIcon: tabIcon('home', 'home-outline'),
        }}
      />
      <Tabs.Screen
        name="map"
        options={{
          title: 'Mappa',
          tabBarIcon: tabIcon('map', 'map-outline'),
        }}
      />
      <Tabs.Screen
        name="calendar"
        options={{
          title: 'Calendario',
          tabBarIcon: tabIcon('calendar', 'calendar-outline'),
        }}
      />
      <Tabs.Screen
        name="chat"
        options={{
          title: 'Chat',
          tabBarIcon: tabIcon('chatbubbles', 'chatbubbles-outline'),
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: 'Profilo',
          tabBarIcon: tabIcon('person', 'person-outline'),
        }}
      />
    </Tabs>
  )
}
