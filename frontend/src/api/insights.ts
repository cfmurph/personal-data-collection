import api from './client'

export interface Insight {
  id: string
  category: string
  title: string
  description: string
  severity: 'info' | 'warning' | 'positive'
  data: Record<string, unknown> | null
}

export const getInsights = () => api.get<Insight[]>('/insights/')
