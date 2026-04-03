import api from './client'

export interface FitnessActivity {
  id: number
  date: string
  activity_type: string
  duration_minutes: number | null
  distance_km: number | null
  calories: number | null
  heart_rate_avg: number | null
  steps: number | null
  import_batch: string | null
  created_at: string
}

export interface FitnessSummary {
  total_workouts: number
  total_duration_minutes: number
  total_calories: number
  total_distance_km: number
  by_activity_type: Record<string, number>
}

export interface ImportBatch {
  batch_id: string
  count: number
  start_date: string
  end_date: string
}

export const importFitnessCSV = (file: File) => {
  const form = new FormData()
  form.append('file', file)
  return api.post('/fitness/import', form)
}

export const getFitnessActivities = (params?: {
  start_date?: string
  end_date?: string
  activity_type?: string
  limit?: number
}) => api.get<FitnessActivity[]>('/fitness/activities', { params })

export const getFitnessSummary = (params?: { start_date?: string; end_date?: string }) =>
  api.get<FitnessSummary>('/fitness/summary', { params })

export const getFitnessBatches = () => api.get<ImportBatch[]>('/fitness/batches')

export const deleteFitnessBatch = (batchId: string) =>
  api.delete(`/fitness/batches/${batchId}`)

export const deleteAllFitness = () => api.delete('/fitness/all')
