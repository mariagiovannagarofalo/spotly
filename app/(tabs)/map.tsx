import { View, Text, StyleSheet } from 'react-native'

export default function MapScreen() {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Mappa</Text>
    </View>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0a0a0a', justifyContent: 'center', alignItems: 'center' },
  title: { color: '#ffffff', fontSize: 24, fontWeight: '600' },
})
