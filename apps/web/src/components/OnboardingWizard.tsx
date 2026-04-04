import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { CheckCircle2, Upload, Heart, ArrowRight, ChevronRight } from 'lucide-react'
import { importFinanceCSV } from '../api/finance'
import { importFitnessCSV } from '../api/fitness'
import { createHabitEntry } from '../api/habits'
import { format } from 'date-fns'

const STEPS = [
  { id: 1, label: 'Welcome', icon: '👋' },
  { id: 2, label: 'Import Data', icon: '📂' },
  { id: 3, label: 'First Check-in', icon: '❤️' },
]

interface OnboardingProps {
  onComplete: () => void
}

export default function OnboardingWizard({ onComplete }: OnboardingProps) {
  const navigate = useNavigate()
  const [step, setStep] = useState(1)
  const [financeImported, setFinanceImported] = useState(false)
  const [fitnessImported, setFitnessImported] = useState(false)
  const [importing, setImporting] = useState<'finance' | 'fitness' | null>(null)
  const [importError, setImportError] = useState<string | null>(null)
  const [mood, setMood] = useState<number | null>(null)
  const [energy, setEnergy] = useState<number | null>(null)
  const [focus, setFocus] = useState<number | null>(null)
  const [savingHabit, setSavingHabit] = useState(false)

  const handleFileUpload = async (type: 'finance' | 'fitness', file: File) => {
    setImporting(type)
    setImportError(null)
    try {
      if (type === 'finance') {
        await importFinanceCSV(file)
        setFinanceImported(true)
      } else {
        await importFitnessCSV(file)
        setFitnessImported(true)
      }
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { detail?: string } } })?.response?.data?.detail || 'Import failed. Check your CSV format.'
      setImportError(msg)
    } finally {
      setImporting(null)
    }
  }

  const handleFinishHabit = async () => {
    if (!mood && !energy && !focus) {
      onComplete()
      return
    }
    setSavingHabit(true)
    try {
      await createHabitEntry({
        date: format(new Date(), 'yyyy-MM-dd'),
        mood,
        energy,
        focus,
      })
    } catch {
      // ignore duplicate if already logged today
    } finally {
      setSavingHabit(false)
      onComplete()
    }
  }

  return (
    <div className="fixed inset-0 bg-gradient-to-br from-indigo-50 to-blue-100 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden">

        {/* Progress bar */}
        <div className="flex border-b border-gray-100">
          {STEPS.map((s) => (
            <div
              key={s.id}
              className={`flex-1 flex items-center justify-center gap-1.5 py-3 text-xs font-semibold transition-colors ${
                step === s.id
                  ? 'bg-indigo-50 text-indigo-700 border-b-2 border-indigo-600'
                  : step > s.id
                  ? 'text-green-600'
                  : 'text-gray-400'
              }`}
            >
              {step > s.id ? <CheckCircle2 size={13} /> : <span>{s.icon}</span>}
              {s.label}
            </div>
          ))}
        </div>

        <div className="p-8">
          {/* ── Step 1: Welcome ── */}
          {step === 1 && (
            <div className="text-center">
              <div className="w-16 h-16 rounded-2xl bg-indigo-600 flex items-center justify-center mx-auto mb-6">
                <span className="text-white font-bold text-2xl">PD</span>
              </div>
              <h2 className="text-2xl font-bold text-gray-900 mb-3">Welcome to Personal Data Hub</h2>
              <p className="text-gray-500 leading-relaxed mb-8">
                Connect your finance and fitness data to unlock cross-domain insights — like how your workout habits affect your spending, or how your mood correlates with activity.
              </p>
              <div className="grid grid-cols-3 gap-4 mb-8">
                {[
                  { icon: '💰', label: 'Track spending', sub: 'Import bank CSV' },
                  { icon: '🏃', label: 'Log fitness', sub: 'Garmin / Strava CSV' },
                  { icon: '💡', label: 'Get insights', sub: 'Cross-domain patterns' },
                ].map((f) => (
                  <div key={f.label} className="bg-gray-50 rounded-xl p-4 text-center">
                    <div className="text-2xl mb-2">{f.icon}</div>
                    <p className="text-xs font-semibold text-gray-700">{f.label}</p>
                    <p className="text-xs text-gray-400 mt-1">{f.sub}</p>
                  </div>
                ))}
              </div>
              <button
                onClick={() => setStep(2)}
                className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-semibold py-3 rounded-xl flex items-center justify-center gap-2 transition-colors"
              >
                Get started <ArrowRight size={18} />
              </button>
            </div>
          )}

          {/* ── Step 2: Import Data ── */}
          {step === 2 && (
            <div>
              <h2 className="text-xl font-bold text-gray-900 mb-1">Import your data</h2>
              <p className="text-gray-500 text-sm mb-6">
                Upload at least one CSV to start seeing insights. You can always add more later.
              </p>

              <div className="space-y-3 mb-6">
                <ImportCard
                  icon="💳"
                  title="Financial CSV"
                  subtitle="date, description, amount[, category, account]"
                  done={financeImported}
                  loading={importing === 'finance'}
                  onFile={(f) => handleFileUpload('finance', f)}
                  color="orange"
                />
                <ImportCard
                  icon="🏋️"
                  title="Fitness CSV"
                  subtitle="date, activity_type[, duration_minutes, calories, …]"
                  done={fitnessImported}
                  loading={importing === 'fitness'}
                  onFile={(f) => handleFileUpload('fitness', f)}
                  color="green"
                />
              </div>

              {importError && (
                <p className="text-red-600 text-sm bg-red-50 rounded-lg px-4 py-2 mb-4">{importError}</p>
              )}

              <button
                onClick={() => setStep(3)}
                className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-semibold py-3 rounded-xl flex items-center justify-center gap-2 transition-colors"
              >
                {financeImported || fitnessImported ? 'Continue' : 'Skip for now'}
                <ArrowRight size={18} />
              </button>
              {!financeImported && !fitnessImported && (
                <p className="text-center text-xs text-gray-400 mt-2">You can import data anytime from Finance or Fitness pages</p>
              )}
            </div>
          )}

          {/* ── Step 3: First check-in ── */}
          {step === 3 && (
            <div>
              <div className="flex items-center gap-2 mb-1">
                <Heart size={20} className="text-pink-500" />
                <h2 className="text-xl font-bold text-gray-900">Log today's habits</h2>
              </div>
              <p className="text-gray-500 text-sm mb-6">
                Daily check-ins are the heartbeat of your insights. How are you feeling today?
              </p>

              <div className="space-y-5 mb-6">
                <EmojiRating label="😊 Mood" value={mood} onChange={setMood} />
                <EmojiRating label="⚡ Energy" value={energy} onChange={setEnergy} />
                <EmojiRating label="🧠 Focus" value={focus} onChange={setFocus} />
              </div>

              <button
                onClick={handleFinishHabit}
                disabled={savingHabit}
                className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-semibold py-3 rounded-xl flex items-center justify-center gap-2 transition-colors disabled:opacity-60"
              >
                {savingHabit ? 'Saving…' : 'Go to my dashboard'}
                <ArrowRight size={18} />
              </button>
              {!mood && !energy && !focus && (
                <p className="text-center text-xs text-gray-400 mt-2">No worries — you can log habits anytime from the Habits page</p>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

function ImportCard({
  icon, title, subtitle, done, loading, onFile, color,
}: {
  icon: string
  title: string
  subtitle: string
  done: boolean
  loading: boolean
  onFile: (f: File) => void
  color: 'orange' | 'green'
}) {
  const colorMap = {
    orange: { bg: 'bg-orange-50', border: 'border-orange-200', text: 'text-orange-600', done: 'bg-orange-100' },
    green: { bg: 'bg-green-50', border: 'border-green-200', text: 'text-green-600', done: 'bg-green-100' },
  }
  const c = colorMap[color]

  return (
    <label className={`flex items-center gap-4 p-4 rounded-xl border-2 cursor-pointer transition-all ${done ? `${c.done} ${c.border}` : `${c.bg} ${c.border} hover:opacity-80`}`}>
      <input
        type="file"
        accept=".csv"
        className="hidden"
        onChange={(e) => { const f = e.target.files?.[0]; if (f) onFile(f) }}
      />
      <span className="text-2xl">{icon}</span>
      <div className="flex-1">
        <p className={`font-semibold text-sm ${c.text}`}>{title}</p>
        <p className="text-xs text-gray-400 font-mono mt-0.5">{subtitle}</p>
      </div>
      {loading ? (
        <div className="w-5 h-5 border-2 border-current border-t-transparent rounded-full animate-spin opacity-60" />
      ) : done ? (
        <CheckCircle2 size={20} className="text-green-500 flex-shrink-0" />
      ) : (
        <Upload size={18} className="text-gray-400 flex-shrink-0" />
      )}
    </label>
  )
}

const EMOJI = ['😞', '😕', '😐', '😊', '😄']

function EmojiRating({ label, value, onChange }: { label: string; value: number | null; onChange: (v: number) => void }) {
  return (
    <div>
      <div className="flex items-center justify-between mb-2">
        <span className="text-sm font-semibold text-gray-700">{label}</span>
        {value && <span className="text-xs text-gray-400">{value}/5</span>}
      </div>
      <div className="flex gap-2">
        {[1, 2, 3, 4, 5].map((n) => (
          <button
            key={n}
            type="button"
            onClick={() => onChange(n)}
            className={`flex-1 py-2.5 rounded-xl text-xl border-2 transition-all ${value === n ? 'border-indigo-500 bg-indigo-50 scale-105' : 'border-gray-200 hover:border-gray-300'}`}
          >
            {EMOJI[n - 1]}
          </button>
        ))}
      </div>
    </div>
  )
}
