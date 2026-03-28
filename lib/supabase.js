import AsyncStorage from '@react-native-async-storage/async-storage'
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://fflqvlktdnempbcaeows.supabase.co'
const supabaseAnonKey = 'sb_publishable_2oW9igJj_-uT2l-Cocbe4g_3vtNUb0p'

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    storage: AsyncStorage,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
  },
})
