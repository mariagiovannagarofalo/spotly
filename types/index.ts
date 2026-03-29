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
  color?: string
  start_date: string
  end_date?: string
  start_time?: string
  end_time?: string
  all_day?: boolean
  timezone?: string
  recurrence?: 'none' | 'daily' | 'weekly' | 'monthly' | 'yearly'
  link?: string
  photo_url?: string
  visibility: 'public' | 'friends' | 'private'
  created_at: string
  profiles: Profile
  plan_participants: { user_id: string }[]
}
