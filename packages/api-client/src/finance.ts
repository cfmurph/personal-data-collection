import api from './client'
import type { ImportResult, Transaction, TransactionSummary } from './types'

export interface ImportBatch {
  batch_id: string
  count: number
  start_date: string
  end_date: string
}

export const importFinanceCSV = (formData: FormData) =>
  api.post<ImportResult>('/finance/import', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  })

export const getTransactions = (params?: {
  start_date?: string
  end_date?: string
  category?: string
  limit?: number
  offset?: number
}) => api.get<Transaction[]>('/finance/transactions', { params })

export const getFinanceSummary = (params?: { start_date?: string; end_date?: string }) =>
  api.get<TransactionSummary>('/finance/summary', { params })

export const getFinanceBatches = () => api.get<ImportBatch[]>('/finance/batches')
export const deleteFinanceBatch = (batchId: string) => api.delete(`/finance/batches/${batchId}`)
export const deleteAllFinance = () => api.delete('/finance/all')
