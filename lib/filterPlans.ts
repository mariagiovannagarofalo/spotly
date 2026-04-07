import type { PlanFilters } from '../components/shared/FilterBar'
import { Plan } from '../types'

function localISO(date: Date): string {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`
}

function addDays(n: number): string {
  const d = new Date()
  d.setDate(d.getDate() + n)
  return localISO(d)
}

export function filterPlans(plans: Plan[], filters: PlanFilters, userId: string | null, query = ''): Plan[] {
  const q = query.toLowerCase().trim()
  const today = localISO(new Date())
  const weekEnd = addDays(7)
  const monthEnd = addDays(30)

  return plans.filter(plan => {
    const end = plan.end_date ?? plan.start_date

    if (filters.time === 'today' && !(plan.start_date <= today && end >= today)) return false
    if (filters.time === 'week' && !(plan.start_date <= weekEnd && end >= today)) return false
    if (filters.time === 'month' && !(plan.start_date <= monthEnd && end >= today)) return false

    if (filters.activity !== 'all' && plan.activity !== filters.activity) return false

    if (filters.onlyMine && plan.user_id !== userId) return false

    if (filters.color !== null && plan.color !== filters.color) return false

    if (filters.groupId !== null) {
      const inGroup = plan.plan_groups?.some(pg => pg.group_id === filters.groupId)
      if (!inGroup) return false
    }

    if (q) {
      const inTitle = plan.title.toLowerCase().includes(q)
      const inLocation = plan.location.toLowerCase().includes(q)
      const inUsername = (plan.profiles?.username ?? '').toLowerCase().includes(q)
      const inFullName = (plan.profiles?.full_name ?? '').toLowerCase().includes(q)
      if (!inTitle && !inLocation && !inUsername && !inFullName) return false
    }

    return true
  })
}
