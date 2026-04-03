import api from './client'

export interface DataSource {
  id: number
  source_type: string
  label: string | null
  batch_id: string | null
  record_count: number
  status: string
  meta: Record<string, unknown> | null
  created_at: string
}

export const getDataSources = () => api.get<DataSource[]>('/data-sources/')
export const deleteDataSource = (id: number) => api.delete(`/data-sources/${id}`)
