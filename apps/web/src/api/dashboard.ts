import api from './client'

export interface DashboardSummary {
  finance: {
    spend_30_days: number
    income_30_days: number
    spend_7_days: number
    transaction_count: number
    spend_by_day: Record<string, number>
  }
  fitness: {
    workouts_30_days: number
    workouts_7_days: number
    calories_30_days: number
    recent_activities: Array<{
      date: string
      activity_type: string
      duration_minutes: number | null
      calories: number | null
    }>
  }
  habits: {
    avg_mood_7_days: number | null
    avg_energy_7_days: number | null
    entries_7_days: number
    today_logged: boolean
    today: {
      mood: number | null
      energy: number | null
      focus: number | null
    } | null
  }
  date: string
}

export const getDashboardSummary = () => api.get<DashboardSummary>('/dashboard/summary')
