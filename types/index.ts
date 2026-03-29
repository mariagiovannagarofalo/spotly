export type Profile = {
  id: string
  username: string
  full_name: string
  avatar_url?: string
  bio?: string
  created_at: string
}

export type Plan = {
  id: string
  user_id: string
  title: string
  description?: string
  location: string
  activity?: string
  start_date: string
  end_date?: string
  visibility: 'public' | 'friends' | 'private'
  created_at: string
  profiles: Profile
  plan_participants: { user_id: string }[]
}
