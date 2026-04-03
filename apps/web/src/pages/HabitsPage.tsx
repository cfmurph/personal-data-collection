import { useEffect, useState } from 'react'
import { format, subDays, parseISO } from 'date-fns'
import { createHabitEntry, updateHabitEntry, getHabitEntries, type HabitEntry } from '../api/habits'
import toast from 'react-hot-toast'
import { Heart, Zap, Brain, Save } from 'lucide-react'
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, Legend } from 'recharts'

interface CheckInForm {
  mood: number | null
  energy: number | null
  focus: number | null
  notes: string
}

const EMOJI_SCALE = ['', '😞', '😕', '😐', '😊', '😄']

export default function HabitsPage() {
  const today = format(new Date(), 'yyyy-MM-dd')
  const [entries, setEntries] = useState<HabitEntry[]>([])
  const [todayEntry, setTodayEntry] = useState<HabitEntry | null>(null)
  const [form, setForm] = useState<CheckInForm>({ mood: null, energy: null, focus: null, notes: '' })
  const [saving, setSaving] = useState(false)
  const [refreshKey, setRefreshKey] = useState(0)

  const thirtyDaysAgo = format(subDays(new Date(), 30), 'yyyy-MM-dd')

  useEffect(() => {
    getHabitEntries({ start_date: thirtyDaysAgo }).then((res) => {
      const all = res.data
      setEntries(all)
      const te = all.find((e) => e.date === today) || null
      setTodayEntry(te)
      if (te) {
        setForm({
          mood: te.mood,
          energy: te.energy,
          focus: te.focus,
          notes: te.notes || '',
        })
      }
    })
  }, [refreshKey])

  const handleSave = async () => {
    if (!form.mood && !form.energy && !form.focus) {
      toast.error('Please rate at least one metric before saving.')
      return
    }
    setSaving(true)
    try {
      const payload = {
        date: today,
        mood: form.mood,
        energy: form.energy,
        focus: form.focus,
        notes: form.notes || null,
      }
      if (todayEntry) {
        await updateHabitEntry(today, payload)
        toast.success('Check-in updated!')
      } else {
        await createHabitEntry(payload)
        toast.success("Today's check-in saved!")
      }
      setRefreshKey((k) => k + 1)
    } catch {
      toast.error('Failed to save. Try again.')
    } finally {
      setSaving(false)
    }
  }

  // Build chart data
  const chartData = [...entries]
    .sort((a, b) => a.date.localeCompare(b.date))
    .map((e) => ({
      date: format(parseISO(e.date), 'MMM d'),
      Mood: e.mood,
      Energy: e.energy,
      Focus: e.focus,
    }))

  return (
    <div className="space-y-6 max-w-3xl">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Daily Habits</h1>
        <p className="text-gray-500 text-sm mt-1">Track your mood, energy, and focus each day</p>
      </div>

      {/* Daily check-in */}
      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <div className="flex items-center justify-between mb-5">
          <h2 className="font-semibold text-gray-900">
            Today's Check-in
            <span className="ml-2 text-sm font-normal text-gray-400">{format(new Date(), 'EEEE, MMM d')}</span>
          </h2>
          {todayEntry && (
            <span className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded-full font-medium">
              Logged
            </span>
          )}
        </div>

        <div className="space-y-6">
          {/* Mood */}
          <MetricRating
            label="Mood"
            icon={<Heart size={16} className="text-pink-500" />}
            value={form.mood}
            onChange={(v) => setForm({ ...form, mood: v })}
          />
          {/* Energy */}
          <MetricRating
            label="Energy"
            icon={<Zap size={16} className="text-amber-500" />}
            value={form.energy}
            onChange={(v) => setForm({ ...form, energy: v })}
          />
          {/* Focus */}
          <MetricRating
            label="Focus"
            icon={<Brain size={16} className="text-indigo-500" />}
            value={form.focus}
            onChange={(v) => setForm({ ...form, focus: v })}
          />

          {/* Notes */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Notes (optional)</label>
            <textarea
              value={form.notes}
              onChange={(e) => setForm({ ...form, notes: e.target.value })}
              rows={3}
              placeholder="How did the day go? Any observations..."
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none resize-none"
            />
          </div>

          <button
            onClick={handleSave}
            disabled={saving}
            className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white font-medium text-sm px-5 py-2.5 rounded-lg transition-colors disabled:opacity-50"
          >
            <Save size={16} />
            {saving ? 'Saving...' : todayEntry ? 'Update Check-in' : 'Save Check-in'}
          </button>
        </div>
      </div>

      {/* Trend chart */}
      {chartData.length > 1 && (
        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <h2 className="font-semibold text-gray-900 mb-4">Trends (30 days)</h2>
          <ResponsiveContainer width="100%" height={200}>
            <LineChart data={chartData} margin={{ top: 0, right: 0, bottom: 0, left: -20 }}>
              <XAxis dataKey="date" tick={{ fontSize: 11 }} interval="preserveStartEnd" />
              <YAxis domain={[1, 5]} ticks={[1, 2, 3, 4, 5]} tick={{ fontSize: 11 }} />
              <Tooltip />
              <Legend wrapperStyle={{ fontSize: 12 }} />
              <Line type="monotone" dataKey="Mood" stroke="#ec4899" strokeWidth={2} dot={false} />
              <Line type="monotone" dataKey="Energy" stroke="#f59e0b" strokeWidth={2} dot={false} />
              <Line type="monotone" dataKey="Focus" stroke="#6366f1" strokeWidth={2} dot={false} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* History log */}
      {entries.length > 0 && (
        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <h2 className="font-semibold text-gray-900 mb-4">History</h2>
          <div className="space-y-2">
            {entries.slice(0, 30).map((e) => (
              <div key={e.id} className="flex items-center gap-4 py-2 border-b border-gray-50 last:border-0 text-sm">
                <span className="text-gray-400 w-24 flex-shrink-0">{format(parseISO(e.date), 'MMM d, EEE')}</span>
                <div className="flex gap-4 flex-1">
                  {e.mood && <span title="Mood">❤️ {EMOJI_SCALE[e.mood]} {e.mood}/5</span>}
                  {e.energy && <span title="Energy">⚡ {e.energy}/5</span>}
                  {e.focus && <span title="Focus">🧠 {e.focus}/5</span>}
                </div>
                {e.notes && (
                  <span className="text-gray-400 text-xs truncate max-w-[180px]" title={e.notes}>
                    "{e.notes}"
                  </span>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

function MetricRating({
  label,
  icon,
  value,
  onChange,
}: {
  label: string
  icon: React.ReactNode
  value: number | null
  onChange: (v: number) => void
}) {
  const EMOJI = ['😞', '😕', '😐', '😊', '😄']
  return (
    <div>
      <div className="flex items-center gap-2 mb-2">
        {icon}
        <span className="text-sm font-medium text-gray-700">{label}</span>
        {value && <span className="text-xs text-gray-400">({value}/5)</span>}
      </div>
      <div className="flex gap-2">
        {[1, 2, 3, 4, 5].map((n) => (
          <button
            key={n}
            onClick={() => onChange(n)}
            className={`flex-1 py-2.5 rounded-lg text-lg border-2 transition-all ${
              value === n
                ? 'border-indigo-500 bg-indigo-50 scale-105'
                : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
            }`}
            title={`${n}/5`}
          >
            {EMOJI[n - 1]}
          </button>
        ))}
      </div>
    </div>
  )
}
