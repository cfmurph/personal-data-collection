import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { DollarSign, Dumbbell, Heart, TrendingUp, Lightbulb, ArrowRight, Plus, Target } from 'lucide-react'
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts'
import { getDashboardSummary, type DashboardSummary } from '../api/dashboard'
import { getInsights, type Insight } from '../api/insights'
import { getGoals, type BudgetGoal } from '../api/goals'
import StatCard from '../components/StatCard'
import InsightCard from '../components/InsightCard'
import { useAuth } from '../context/AuthContext'
import { format, parseISO } from 'date-fns'

export default function DashboardPage() {
  const { user } = useAuth()
  const [summary, setSummary] = useState<DashboardSummary | null>(null)
  const [insights, setInsights] = useState<Insight[]>([])
  const [goals, setGoals] = useState<BudgetGoal[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    Promise.all([getDashboardSummary(), getInsights(), getGoals()])
      .then(([s, i, g]) => {
        setSummary(s.data)
        setInsights(i.data)
        setGoals(g.data)
      })
      .finally(() => setLoading(false))
  }, [])

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-8 h-8 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  const spendByDay = summary
    ? Object.entries(summary.finance.spend_by_day)
        .sort(([a], [b]) => a.localeCompare(b))
        .map(([date, amount]) => ({
          date: format(parseISO(date), 'MMM d'),
          amount: Math.round(amount * 100) / 100,
        }))
    : []

  const hasNoData =
    !summary ||
    (summary.finance.transaction_count === 0 &&
      summary.fitness.workouts_30_days === 0 &&
      summary.habits.entries_7_days === 0)

  return (
    <div className="space-y-6 max-w-6xl">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">
          Good {getTimeOfDay()}, {user?.username}
        </h1>
        <p className="text-gray-500 text-sm mt-1">
          {format(new Date(), 'EEEE, MMMM d, yyyy')} · Your personal data overview
        </p>
      </div>

      {hasNoData && (
        <div className="bg-indigo-50 border border-indigo-200 rounded-xl p-6">
          <h2 className="font-semibold text-indigo-900 mb-2">Get started with your data</h2>
          <p className="text-sm text-indigo-700 mb-4">
            Import your financial and fitness data, then log your first daily habit check-in to start seeing insights.
          </p>
          <div className="flex flex-wrap gap-3">
            <Link to="/finance" className="inline-flex items-center gap-2 bg-indigo-600 text-white text-sm font-medium px-4 py-2 rounded-lg hover:bg-indigo-700 transition-colors">
              <Plus size={16} /> Import Finance Data
            </Link>
            <Link to="/fitness" className="inline-flex items-center gap-2 bg-white border border-indigo-300 text-indigo-700 text-sm font-medium px-4 py-2 rounded-lg hover:bg-indigo-50 transition-colors">
              <Plus size={16} /> Import Fitness Data
            </Link>
            <Link to="/habits" className="inline-flex items-center gap-2 bg-white border border-indigo-300 text-indigo-700 text-sm font-medium px-4 py-2 rounded-lg hover:bg-indigo-50 transition-colors">
              <Plus size={16} /> Log Today's Habits
            </Link>
          </div>
        </div>
      )}

      {/* Stats grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          label="Spent (30 days)"
          value={`$${(summary?.finance.spend_30_days ?? 0).toFixed(0)}`}
          sub={`$${(summary?.finance.spend_7_days ?? 0).toFixed(0)} this week`}
          icon={<DollarSign size={20} />}
          color="orange"
        />
        <StatCard
          label="Workouts (30 days)"
          value={summary?.fitness.workouts_30_days ?? 0}
          sub={`${summary?.fitness.workouts_7_days ?? 0} this week`}
          icon={<Dumbbell size={20} />}
          color="green"
        />
        <StatCard
          label="Avg Mood (7 days)"
          value={summary?.habits.avg_mood_7_days != null ? `${summary.habits.avg_mood_7_days.toFixed(1)} / 5` : '—'}
          sub={`${summary?.habits.entries_7_days ?? 0} check-ins this week`}
          icon={<Heart size={20} />}
          color="purple"
        />
        <StatCard
          label="Avg Energy (7 days)"
          value={summary?.habits.avg_energy_7_days != null ? `${summary.habits.avg_energy_7_days.toFixed(1)} / 5` : '—'}
          sub={summary?.habits.today_logged ? 'Logged today' : 'Not logged today'}
          icon={<TrendingUp size={20} />}
          color="blue"
        />
      </div>

      {/* Charts + recent */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Spending chart */}
        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-semibold text-gray-900">Daily Spending (7 days)</h2>
            <Link to="/finance" className="text-xs text-indigo-600 hover:underline flex items-center gap-1">
              View all <ArrowRight size={12} />
            </Link>
          </div>
          {spendByDay.length > 0 ? (
            <ResponsiveContainer width="100%" height={180}>
              <BarChart data={spendByDay} margin={{ top: 0, right: 0, bottom: 0, left: -20 }}>
                <XAxis dataKey="date" tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 11 }} />
                <Tooltip formatter={(v) => [`$${v}`, 'Spent']} />
                <Bar dataKey="amount" fill="#6366f1" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <EmptyState message="No spending data yet. Import a CSV to get started." />
          )}
        </div>

        {/* Recent workouts */}
        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-semibold text-gray-900">Recent Workouts</h2>
            <Link to="/fitness" className="text-xs text-indigo-600 hover:underline flex items-center gap-1">
              View all <ArrowRight size={12} />
            </Link>
          </div>
          {summary?.fitness.recent_activities.length ? (
            <ul className="space-y-2">
              {summary.fitness.recent_activities.map((a, i) => (
                <li key={i} className="flex items-center justify-between py-2 border-b border-gray-100 last:border-0">
                  <div>
                    <p className="text-sm font-medium text-gray-800">{a.activity_type}</p>
                    <p className="text-xs text-gray-400">{format(parseISO(a.date), 'MMM d')}</p>
                  </div>
                  <div className="text-right">
                    {a.duration_minutes && (
                      <p className="text-sm text-gray-600">{a.duration_minutes} min</p>
                    )}
                    {a.calories && (
                      <p className="text-xs text-gray-400">{a.calories} kcal</p>
                    )}
                  </div>
                </li>
              ))}
            </ul>
          ) : (
            <EmptyState message="No workout data yet. Import a fitness CSV." />
          )}
        </div>
      </div>

      {/* Budget goals progress */}
      {goals.length > 0 && (
        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Target size={18} className="text-indigo-500" />
              <h2 className="font-semibold text-gray-900">Budget Goals</h2>
            </div>
            <Link to="/goals" className="text-xs text-indigo-600 hover:underline flex items-center gap-1">
              Manage <ArrowRight size={12} />
            </Link>
          </div>
          <div className="space-y-3">
            {goals.slice(0, 4).map((goal) => {
              const over = goal.spent_this_month > goal.monthly_limit
              const pct = Math.min(goal.percent_used, 100)
              return (
                <div key={goal.id}>
                  <div className="flex justify-between text-sm mb-1">
                    <span className="text-gray-700 font-medium">{goal.category}</span>
                    <span className={over ? 'text-red-600 font-semibold' : 'text-gray-500'}>
                      ${goal.spent_this_month.toFixed(0)} / ${goal.monthly_limit.toFixed(0)}
                    </span>
                  </div>
                  <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
                    <div
                      className={`h-1.5 rounded-full transition-all ${over ? 'bg-red-500' : pct >= 80 ? 'bg-amber-400' : 'bg-indigo-500'}`}
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* Insights preview */}
      <div className="bg-white rounded-xl border border-gray-200 p-5">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Lightbulb size={18} className="text-amber-500" />
            <h2 className="font-semibold text-gray-900">Top Insights</h2>
          </div>
          <Link to="/insights" className="text-xs text-indigo-600 hover:underline flex items-center gap-1">
            View all <ArrowRight size={12} />
          </Link>
        </div>
        {insights.length > 0 ? (
          <div className="space-y-3">
            {insights.slice(0, 3).map((insight) => (
              <InsightCard key={insight.id} insight={insight} />
            ))}
          </div>
        ) : (
          <EmptyState message="Add data from multiple sources to unlock personalized insights." />
        )}
      </div>

      {/* Today's habits quick-log */}
      {!summary?.habits.today_logged && (
        <div className="bg-gradient-to-r from-purple-50 to-indigo-50 border border-purple-200 rounded-xl p-5 flex items-center justify-between">
          <div>
            <h2 className="font-semibold text-gray-900">Log today's habits</h2>
            <p className="text-sm text-gray-500 mt-0.5">Track your mood, energy, and focus</p>
          </div>
          <Link
            to="/habits"
            className="flex items-center gap-2 bg-indigo-600 text-white text-sm font-medium px-4 py-2 rounded-lg hover:bg-indigo-700 transition-colors"
          >
            <Plus size={16} /> Check in
          </Link>
        </div>
      )}
    </div>
  )
}

function getTimeOfDay() {
  const h = new Date().getHours()
  if (h < 12) return 'morning'
  if (h < 17) return 'afternoon'
  return 'evening'
}

function EmptyState({ message }: { message: string }) {
  return (
    <div className="py-8 text-center">
      <p className="text-sm text-gray-400">{message}</p>
    </div>
  )
}
