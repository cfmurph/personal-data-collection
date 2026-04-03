import api from './client'
import type { Insight } from './types'

export const getInsights = () => api.get<Insight[]>('/insights/')
