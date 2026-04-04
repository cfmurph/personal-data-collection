import { useEffect, useState } from 'react'
import { getGoals, upsertGoal, deleteGoal, type BudgetGoal } from '../api/goals'
import { getFinanceSummary } from '../api/finance'
import toast from 'react-hot-toast'
import { Target, Plus, Trash2, X, Check } from 'lucide-react'
import { format, subDays } from 'date-fns'

const COMMON_CATEGORIES = [
  'Food & Dining', 'Transport', 'Shopping', 'Entertainment',
  'Health & Fitness', 'Utilities', 'Housing', 'Travel', 'Education',
]

function GoalCard({ goal, onDelete }: { goal: BudgetGoal; onDelete: () => void }) {
  const over = goal.spent_this_month > goal.monthly_limit
  const pct = Math.min(goal.percent_used, 100)
  const barColor = pct >= 100 ? 'bg-red-500' : pct >= 80 ? 'bg-amber-400' : 'bg-indigo-500'

  return (
    <div className={`bg-white rounded-xl border p-5 ${over ? 'border-red-200' : 'border-gray-200'}`}>
      <div className="flex items-center justify-between mb-3">
        <div>
          <p className="font-semibold text-gray-900">{goal.category}</p>
          <p className="text-xs text-gray-400">Monthly budget</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="text-right">
            <p className={`font-bold text-lg ${over ? 'text-red-600' : 'text-gray-900'}`}>
              ${goal.spent_this_month.toFixed(0)}
              <span className="text-sm font-normal text-gray-400"> / ${goal.monthly_limit.toFixed(0)}</span>
            </p>
            {over && <p className="text-xs text-red-500 font-medium">Over budget!</p>}
          </div>
          <button
            onClick={onDelete}
            className="p-1.5 text-gray-300 hover:text-red-400 hover:bg-red-50 rounded-lg transition-colors"
          >
            <Trash2 size={15} />
          </button>
        </div>
      </div>
      <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
        <div
          className={`h-2 rounded-full transition-all duration-500 ${barColor}`}
          style={{ width: `${pct}%` }}
        />
      </div>
      <p className="text-xs text-gray-400 mt-1.5">{pct.toFixed(0)}% used this month</p>
    </div>
  )
}

interface AddGoalFormProps {
  existingCategories: string[]
  onSave: (category: string, limit: number) => Promise<void>
  onCancel: () => void
}

function AddGoalForm({ existingCategories, onSave, onCancel }: AddGoalFormProps) {
  const [category, setCategory] = useState('')
  const [limit, setLimit] = useState('')
  const [saving, setSaving] = useState(false)
  const available = COMMON_CATEGORIES.filter((c) => !existingCategories.includes(c))

  const handleSave = async () => {
    if (!category || !limit || isNaN(Number(limit)) || Number(limit) <= 0) {
      toast.error('Enter a category and a valid amount.')
      return
    }
    setSaving(true)
    try {
      await onSave(category, Number(limit))
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="bg-indigo-50 border border-indigo-200 rounded-xl p-5">
      <p className="font-semibold text-gray-900 mb-4">New Budget Goal</p>
      <div className="space-y-3">
        <div>
          <label className="block text-xs font-semibold text-gray-600 mb-1">Category</label>
          <select
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-500 outline-none bg-white"
          >
            <option value="">Select a category…</option>
            {available.map((c) => <option key={c} value={c}>{c}</option>)}
            <option value="__custom">Custom…</option>
          </select>
          {category === '__custom' && (
            <input
              type="text"
              placeholder="Enter custom category"
              className="w-full mt-2 border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-500 outline-none"
              onChange={(e) => setCategory(e.target.value || '__custom')}
            />
          )}
        </div>
        <div>
          <label className="block text-xs font-semibold text-gray-600 mb-1">Monthly Limit ($)</label>
          <input
            type="number"
            min="1"
            placeholder="e.g. 300"
            value={limit}
            onChange={(e) => setLimit(e.target.value)}
            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-500 outline-none"
          />
        </div>
        <div className="flex gap-2 pt-1">
          <button
            onClick={handleSave}
            disabled={saving}
            className="flex items-center gap-1.5 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-semibold px-4 py-2 rounded-lg disabled:opacity-60 transition-colors"
          >
            <Check size={14} /> {saving ? 'Saving…' : 'Save'}
          </button>
          <button onClick={onCancel} className="flex items-center gap-1.5 text-sm font-medium text-gray-600 hover:bg-gray-100 px-4 py-2 rounded-lg transition-colors">
            <X size={14} /> Cancel
          </button>
        </div>
      </div>
    </div>
  )
}

export default function GoalsPage() {
  const [goals, setGoals] = useState<BudgetGoal[]>([])
  const [topCategories, setTopCategories] = useState<string[]>([])
  const [adding, setAdding] = useState(false)
  const [loading, setLoading] = useState(true)

  const load = async () => {
    try {
      const [g, summary] = await Promise.all([
        getGoals(),
        getFinanceSummary({ start_date: format(subDays(new Date(), 30), 'yyyy-MM-dd') }),
      ])
      setGoals(g.data)
      setTopCategories(
        Object.entries(summary.data.by_category)
          .sort(([, a], [, b]) => b - a)
          .slice(0, 5)
          .map(([cat]) => cat)
      )
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { load() }, [])

  const handleSave = async (category: string, monthly_limit: number) => {
    await upsertGoal(category, monthly_limit)
    toast.success(`Budget set for ${category}`)
    setAdding(false)
    load()
  }

  const handleDelete = async (category: string) => {
    await deleteGoal(category)
    toast.success('Goal removed')
    load()
  }

  const overBudget = goals.filter((g) => g.spent_this_month > g.monthly_limit)
  const totalBudgeted = goals.reduce((s, g) => s + g.monthly_limit, 0)
  const totalSpent = goals.reduce((s, g) => s + g.spent_this_month, 0)

  return (
    <div className="space-y-6 max-w-2xl">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Budget Goals</h1>
          <p className="text-gray-500 text-sm mt-1">Set monthly spending limits per category</p>
        </div>
        {!adding && (
          <button
            onClick={() => setAdding(true)}
            className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-semibold px-4 py-2 rounded-lg transition-colors"
          >
            <Plus size={16} /> Add Goal
          </button>
        )}
      </div>

      {/* Over budget alert */}
      {overBudget.length > 0 && (
        <div className="bg-red-50 border border-red-200 rounded-xl p-4 flex items-start gap-3">
          <span className="text-xl flex-shrink-0">⚠️</span>
          <div>
            <p className="font-semibold text-red-700">Over budget this month</p>
            <p className="text-sm text-red-600 mt-0.5">
              {overBudget.map((g) => g.category).join(', ')}
            </p>
          </div>
        </div>
      )}

      {/* Summary */}
      {goals.length > 0 && (
        <div className="grid grid-cols-2 gap-4">
          <div className="bg-white rounded-xl border border-gray-200 p-4">
            <p className="text-sm text-gray-500">Total budgeted</p>
            <p className="text-2xl font-bold text-gray-900 mt-1">${totalBudgeted.toFixed(0)}<span className="text-sm font-normal text-gray-400">/mo</span></p>
          </div>
          <div className="bg-white rounded-xl border border-gray-200 p-4">
            <p className="text-sm text-gray-500">Spent vs budget</p>
            <p className={`text-2xl font-bold mt-1 ${totalSpent > totalBudgeted ? 'text-red-600' : 'text-gray-900'}`}>
              ${totalSpent.toFixed(0)}
              <span className="text-sm font-normal text-gray-400"> / ${totalBudgeted.toFixed(0)}</span>
            </p>
          </div>
        </div>
      )}

      {adding && (
        <AddGoalForm
          existingCategories={goals.map((g) => g.category)}
          onSave={handleSave}
          onCancel={() => setAdding(false)}
        />
      )}

      {loading ? (
        <div className="py-12 text-center text-gray-400">Loading…</div>
      ) : goals.length === 0 && !adding ? (
        <div className="bg-white rounded-xl border border-gray-200 p-10 text-center">
          <Target size={40} className="text-gray-200 mx-auto mb-3" />
          <p className="font-semibold text-gray-700 mb-1">No budget goals yet</p>
          <p className="text-sm text-gray-400 mb-6 max-w-xs mx-auto">
            Set monthly spending limits to track how you're doing against your targets.
          </p>
          {topCategories.length > 0 && (
            <div>
              <p className="text-xs text-gray-400 mb-3">Your top spending categories:</p>
              <div className="flex flex-wrap gap-2 justify-center">
                {topCategories.map((cat) => (
                  <button
                    key={cat}
                    onClick={() => setAdding(true)}
                    className="text-xs bg-gray-100 hover:bg-indigo-50 hover:text-indigo-600 text-gray-600 px-3 py-1.5 rounded-full transition-colors font-medium"
                  >
                    + {cat}
                  </button>
                ))}
              </div>
            </div>
          )}
          <button
            onClick={() => setAdding(true)}
            className="mt-6 inline-flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-semibold px-5 py-2.5 rounded-lg transition-colors"
          >
            <Plus size={16} /> Set first goal
          </button>
        </div>
      ) : (
        <div className="space-y-3">
          {goals.map((goal) => (
            <GoalCard
              key={goal.id}
              goal={goal}
              onDelete={() => handleDelete(goal.category)}
            />
          ))}
        </div>
      )}
    </div>
  )
}
