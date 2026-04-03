import axios, { type AxiosInstance } from 'axios'
import { API_BASE_URL } from '../constants/api'

// ── Types ─────────────────────────────────────────────────────────────────────

export interface User { id: number; email: string; username: string; created_at: string }
export interface LoginResponse { access_token: string; token_type: string; user: User }
export interface Transaction {
  id: number; date: string; description: string; amount: number
  category: string | null; account: string | null; notes: string | null
  import_batch: string | null; created_at: string
}
export interface TransactionSummary {
  total_spent: number; total_income: number; net: number
  by_category: Record<string, number>; transaction_count: number
}
export interface FitnessActivity {
  id: number; date: string; activity_type: string
  duration_minutes: number | null; distance_km: number | null
  calories: number | null; heart_rate_avg: number | null
  steps: number | null; import_batch: string | null; created_at: string
}
export interface FitnessSummary {
  total_workouts: number; total_duration_minutes: number
  total_calories: number; total_distance_km: number
  by_activity_type: Record<string, number>
}
export interface HabitEntry {
  id: number; date: string; mood: number | null; energy: number | null
  focus: number | null; notes: string | null; created_at: string; updated_at: string
}
export interface Insight {
  id: string; category: string; title: string; description: string
  severity: 'info' | 'warning' | 'positive'; data: Record<string, unknown> | null
}
export interface DashboardSummary {
  finance: { spend_30_days: number; income_30_days: number; spend_7_days: number; transaction_count: number; spend_by_day: Record<string, number> }
  fitness: { workouts_30_days: number; workouts_7_days: number; calories_30_days: number; recent_activities: Array<{ date: string; activity_type: string; duration_minutes: number | null; calories: number | null }> }
  habits: { avg_mood_7_days: number | null; avg_energy_7_days: number | null; entries_7_days: number; today_logged: boolean; today: { mood: number | null; energy: number | null; focus: number | null } | null }
  date: string
}
export interface DataSource {
  id: number; source_type: string; label: string | null; batch_id: string | null
  record_count: number; status: string; meta: Record<string, unknown> | null; created_at: string
}
export interface ImportResult {
  imported: number; duplicates_skipped: number; errors: number
  batch_id: string; error_details: string[]
}

// ── Client ────────────────────────────────────────────────────────────────────

let _token: string | null = null
let _onUnauthorized: () => void = () => {}

export function configureApiClient(options: { getToken: () => string | null; onUnauthorized: () => void }) {
  _token = options.getToken()
  _onUnauthorized = options.onUnauthorized
}

const api: AxiosInstance = axios.create({ baseURL: API_BASE_URL })

api.interceptors.request.use((config) => {
  if (_token) config.headers.Authorization = `Bearer ${_token}`
  return config
})

api.interceptors.response.use(
  (res) => res,
  (error) => {
    if (error.response?.status === 401) _onUnauthorized()
    return Promise.reject(error)
  }
)

// ── Auth ──────────────────────────────────────────────────────────────────────
export const register = (data: { email: string; username: string; password: string }) =>
  api.post<User>('/auth/register', data)

export const login = (email: string, password: string) => {
  const formData = new FormData()
  formData.append('username', email)
  formData.append('password', password)
  return api.post<LoginResponse>('/auth/login', formData)
}

export const getMe = () => api.get<User>('/auth/me')

// ── Finance ───────────────────────────────────────────────────────────────────
export const importFinanceCSV = (formData: FormData) =>
  api.post<ImportResult>('/finance/import', formData, { headers: { 'Content-Type': 'multipart/form-data' } })

export const getTransactions = (params?: { start_date?: string; end_date?: string; limit?: number }) =>
  api.get<Transaction[]>('/finance/transactions', { params })

export const getFinanceSummary = (params?: { start_date?: string; end_date?: string }) =>
  api.get<TransactionSummary>('/finance/summary', { params })

export const deleteFinanceBatch = (batchId: string) => api.delete(`/finance/batches/${batchId}`)
export const deleteAllFinance = () => api.delete('/finance/all')

// ── Fitness ───────────────────────────────────────────────────────────────────
export const importFitnessCSV = (formData: FormData) =>
  api.post<ImportResult>('/fitness/import', formData, { headers: { 'Content-Type': 'multipart/form-data' } })

export const getFitnessActivities = (params?: { start_date?: string; limit?: number }) =>
  api.get<FitnessActivity[]>('/fitness/activities', { params })

export const getFitnessSummary = (params?: { start_date?: string; end_date?: string }) =>
  api.get<FitnessSummary>('/fitness/summary', { params })

export const deleteFitnessBatch = (batchId: string) => api.delete(`/fitness/batches/${batchId}`)
export const deleteAllFitness = () => api.delete('/fitness/all')

// ── Habits ────────────────────────────────────────────────────────────────────
export const createHabitEntry = (data: { date: string; mood?: number | null; energy?: number | null; focus?: number | null; notes?: string | null }) =>
  api.post<HabitEntry>('/habits/', data)

export const updateHabitEntry = (date: string, data: { mood?: number | null; energy?: number | null; focus?: number | null; notes?: string | null }) =>
  api.patch<HabitEntry>(`/habits/${date}`, data)

export const getHabitEntries = (params?: { start_date?: string; end_date?: string; limit?: number }) =>
  api.get<HabitEntry[]>('/habits/', { params })

export const deleteHabitEntry = (date: string) => api.delete(`/habits/${date}`)

// ── Insights ──────────────────────────────────────────────────────────────────
export const getInsights = () => api.get<Insight[]>('/insights/')

// ── Dashboard ─────────────────────────────────────────────────────────────────
export const getDashboardSummary = () => api.get<DashboardSummary>('/dashboard/summary')

// ── Data Sources ──────────────────────────────────────────────────────────────
export const getDataSources = () => api.get<DataSource[]>('/data-sources/')
export const deleteDataSource = (id: number) => api.delete(`/data-sources/${id}`)

export default api
