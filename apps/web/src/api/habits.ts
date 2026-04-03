import api from './client'

export interface HabitEntry {
  id: number
  date: string
  mood: number | null
  energy: number | null
  focus: number | null
  notes: string | null
  created_at: string
  updated_at: string
}

export const createHabitEntry = (data: {
  date: string
  mood?: number | null
  energy?: number | null
  focus?: number | null
  notes?: string | null
}) => api.post<HabitEntry>('/habits/', data)

export const updateHabitEntry = (
  date: string,
  data: {
    mood?: number | null
    energy?: number | null
    focus?: number | null
    notes?: string | null
  }
) => api.patch<HabitEntry>(`/habits/${date}`, data)

export const getHabitEntries = (params?: { start_date?: string; end_date?: string; limit?: number }) =>
  api.get<HabitEntry[]>('/habits/', { params })

export const getHabitEntry = (date: string) => api.get<HabitEntry>(`/habits/${date}`)

export const deleteHabitEntry = (date: string) => api.delete(`/habits/${date}`)
