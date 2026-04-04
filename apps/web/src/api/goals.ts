import api from './client'

export interface BudgetGoal {
  id: number
  category: string
  monthly_limit: number
  spent_this_month: number
  percent_used: number
}

export interface HabitStreaks {
  current_streak: number
  best_streak: number
  total_logged_days: number
}

export const getGoals = () => api.get<BudgetGoal[]>('/goals/')
export const upsertGoal = (category: string, monthly_limit: number) =>
  api.put<BudgetGoal>(`/goals/${encodeURIComponent(category)}`, { category, monthly_limit })
export const deleteGoal = (category: string) =>
  api.delete(`/goals/${encodeURIComponent(category)}`)

export const getHabitStreaks = () => api.get<HabitStreaks>('/habits/streaks')
