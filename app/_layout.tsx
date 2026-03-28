import { Session } from '@supabase/supabase-js'
import * as Linking from 'expo-linking'
import { Slot } from 'expo-router'
import { useEffect, useState } from 'react'
import { View } from 'react-native'
import { supabase } from '../lib/supabase'
import Auth from './auth'

export default function RootLayout() {
  const [session, setSession] = useState<Session | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session)
      setLoading(false)
    })

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session)
    })

    // Gestisce il deep link quando l'app si apre dal link email
    const handleDeepLink = async (url: string) => {
      if (!url) return
      const parsed = Linking.parse(url)
      const access_token = parsed.queryParams?.access_token as string
      const refresh_token = parsed.queryParams?.refresh_token as string
      if (access_token && refresh_token) {
        await supabase.auth.setSession({ access_token, refresh_token })
      }
    }

    Linking.getInitialURL().then(url => { if (url) handleDeepLink(url) })
    const linkSub = Linking.addEventListener('url', ({ url }) => handleDeepLink(url))

    return () => {
      subscription.unsubscribe()
      linkSub.remove()
    }
  }, [])

  if (loading) return <View style={{ flex: 1, backgroundColor: '#0a0a0a' }} />

  return session ? <Slot /> : <Auth />
}
