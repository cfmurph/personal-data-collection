import api from './client'

export interface Transaction {
  id: number
  date: string
  description: string
  amount: number
  category: string | null
  account: string | null
  notes: string | null
  import_batch: string | null
  created_at: string
}

export interface TransactionSummary {
  total_spent: number
  total_income: number
  net: number
  by_category: Record<string, number>
  transaction_count: number
}

export interface ImportBatch {
  batch_id: string
  count: number
  start_date: string
  end_date: string
}

export const importFinanceCSV = (file: File) => {
  const form = new FormData()
  form.append('file', file)
  return api.post('/finance/import', form)
}

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

export const deleteFinanceBatch = (batchId: string) =>
  api.delete(`/finance/batches/${batchId}`)

export const deleteAllFinance = () => api.delete('/finance/all')
