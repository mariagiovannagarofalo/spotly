import { Tabs } from 'expo-router'

export default function TabLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarStyle: {
          backgroundColor: '#0a0a0a',
          borderTopColor: '#1a1a1a',
        },
        tabBarActiveTintColor: '#6C63FF',
        tabBarInactiveTintColor: '#555',
      }}
    >
      <Tabs.Screen name="feed" options={{ title: 'Feed' }} />
      <Tabs.Screen name="map" options={{ title: 'Mappa' }} />
      <Tabs.Screen name="calendar" options={{ title: 'Calendario' }} />
      <Tabs.Screen name="chat" options={{ title: 'Chat' }} />
    </Tabs>
  )
}
