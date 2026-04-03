import api from './client'
import type { DataSource } from './types'

export const getDataSources = () => api.get<DataSource[]>('/data-sources/')
export const deleteDataSource = (id: number) => api.delete(`/data-sources/${id}`)
