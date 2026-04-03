import api from './client'
import type { FitnessActivity, FitnessSummary, ImportResult } from './types'

export interface ImportBatch {
  batch_id: string
  count: number
  start_date: string
  end_date: string
}

export const importFitnessCSV = (formData: FormData) =>
  api.post<ImportResult>('/fitness/import', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  })

export const getFitnessActivities = (params?: {
  start_date?: string
  end_date?: string
  activity_type?: string
  limit?: number
}) => api.get<FitnessActivity[]>('/fitness/activities', { params })

export const getFitnessSummary = (params?: { start_date?: string; end_date?: string }) =>
  api.get<FitnessSummary>('/fitness/summary', { params })

export const getFitnessBatches = () => api.get<ImportBatch[]>('/fitness/batches')
export const deleteFitnessBatch = (batchId: string) => api.delete(`/fitness/batches/${batchId}`)
export const deleteAllFitness = () => api.delete('/fitness/all')
