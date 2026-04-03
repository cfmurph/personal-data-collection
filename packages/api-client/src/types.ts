// ── Auth ─────────────────────────────────────────────────────────────────────
export interface User {
  id: number
  email: string
  username: string
  created_at: string
}

export interface LoginResponse {
  access_token: string
  token_type: string
  user: User
}

// ── Finance ───────────────────────────────────────────────────────────────────
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

// ── Fitness ───────────────────────────────────────────────────────────────────
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

// ── Habits ────────────────────────────────────────────────────────────────────
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

// ── Insights ──────────────────────────────────────────────────────────────────
export interface Insight {
  id: string
  category: string
  title: string
  description: string
  severity: 'info' | 'warning' | 'positive'
  data: Record<string, unknown> | null
}

// ── Dashboard ─────────────────────────────────────────────────────────────────
export interface DashboardSummary {
  finance: {
    spend_30_days: number
    income_30_days: number
    spend_7_days: number
    transaction_count: number
    spend_by_day: Record<string, number>
  }
  fitness: {
    workouts_30_days: number
    workouts_7_days: number
    calories_30_days: number
    recent_activities: Array<{
      date: string
      activity_type: string
      duration_minutes: number | null
      calories: number | null
    }>
  }
  habits: {
    avg_mood_7_days: number | null
    avg_energy_7_days: number | null
    entries_7_days: number
    today_logged: boolean
    today: { mood: number | null; energy: number | null; focus: number | null } | null
  }
  date: string
}

// ── Data Sources ──────────────────────────────────────────────────────────────
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

// ── Import Result ─────────────────────────────────────────────────────────────
export interface ImportResult {
  imported: number
  duplicates_skipped: number
  errors: number
  batch_id: string
  error_details: string[]
}
