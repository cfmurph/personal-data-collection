import { useEffect, useState } from 'react'
import { format, parseISO, subDays } from 'date-fns'
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts'
import { importFitnessCSV, getFitnessActivities, getFitnessSummary, type FitnessActivity, type FitnessSummary } from '../api/fitness'
import FileUpload from '../components/FileUpload'
import StatCard from '../components/StatCard'
import { Dumbbell, Clock, Flame, Map, RefreshCw } from 'lucide-react'

const COLORS = ['#6366f1', '#8b5cf6', '#ec4899', '#f59e0b', '#10b981', '#3b82f6']

export default function FitnessPage() {
  const [activities, setActivities] = useState<FitnessActivity[]>([])
  const [summary, setSummary] = useState<FitnessSummary | null>(null)
  const [loading, setLoading] = useState(true)
  const [refreshKey, setRefreshKey] = useState(0)

  const thirtyDaysAgo = format(subDays(new Date(), 30), 'yyyy-MM-dd')

  useEffect(() => {
    setLoading(true)
    Promise.all([
      getFitnessActivities({ start_date: thirtyDaysAgo, limit: 100 }),
      getFitnessSummary({ start_date: thirtyDaysAgo }),
    ])
      .then(([a, s]) => {
        setActivities(a.data)
        setSummary(s.data)
      })
      .finally(() => setLoading(false))
  }, [refreshKey])

  const activityTypeData = summary
    ? Object.entries(summary.by_activity_type)
        .sort(([, a], [, b]) => b - a)
        .map(([name, value]) => ({ name, value }))
    : []

  // weekly workout bar chart
  const weeklyData = (() => {
    const buckets: Record<string, number> = {}
    activities.forEach((a) => {
      const week = format(parseISO(a.date), 'MMM d')
      buckets[week] = (buckets[week] || 0) + 1
    })
    return Object.entries(buckets)
      .sort(([a], [b]) => a.localeCompare(b))
      .slice(-14)
      .map(([date, count]) => ({ date, count }))
  })()

  return (
    <div className="space-y-6 max-w-6xl">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Fitness</h1>
          <p className="text-gray-500 text-sm mt-1">Track your workouts and activity</p>
        </div>
        <button
          onClick={() => setRefreshKey((k) => k + 1)}
          className="flex items-center gap-2 text-sm text-gray-600 hover:text-gray-900 border border-gray-300 rounded-lg px-3 py-2 hover:bg-gray-50 transition-colors"
        >
          <RefreshCw size={14} /> Refresh
        </button>
      </div>

      {/* Import */}
      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <h2 className="font-semibold text-gray-900 mb-4">Import Fitness Data</h2>
        <p className="text-sm text-gray-500 mb-4">
          Supports Garmin/Strava-style CSVs and any file with the required columns.
        </p>
        <FileUpload
          label="Drop a fitness CSV here or click to browse"
          description="Garmin exports, Strava data, or custom CSVs"
          sampleHeaders="date, activity_type, duration_minutes, distance_km, calories, heart_rate_avg, steps"
          onUpload={async (file) => {
            const res = await importFitnessCSV(file)
            setRefreshKey((k) => k + 1)
            return res.data
          }}
        />
      </div>

      {/* Summary cards */}
      {summary && (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard label="Workouts (30d)" value={summary.total_workouts} icon={<Dumbbell size={20} />} color="green" />
          <StatCard label="Total Duration" value={`${Math.round(summary.total_duration_minutes)} min`} icon={<Clock size={20} />} color="blue" />
          <StatCard label="Calories Burned" value={`${Math.round(summary.total_calories).toLocaleString()} kcal`} icon={<Flame size={20} />} color="orange" />
          <StatCard label="Distance" value={`${summary.total_distance_km.toFixed(1)} km`} icon={<Map size={20} />} color="purple" />
        </div>
      )}

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <h2 className="font-semibold text-gray-900 mb-4">Workout Frequency</h2>
          {weeklyData.length > 0 ? (
            <ResponsiveContainer width="100%" height={180}>
              <BarChart data={weeklyData} margin={{ top: 0, right: 0, bottom: 0, left: -20 }}>
                <XAxis dataKey="date" tick={{ fontSize: 11 }} />
                <YAxis allowDecimals={false} tick={{ fontSize: 11 }} />
                <Tooltip formatter={(v) => [v, 'Workouts']} />
                <Bar dataKey="count" fill="#10b981" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <EmptyState message="No workout data yet." />
          )}
        </div>

        {activityTypeData.length > 0 && (
          <div className="bg-white rounded-xl border border-gray-200 p-5">
            <h2 className="font-semibold text-gray-900 mb-4">Activity Breakdown</h2>
            <ResponsiveContainer width="100%" height={180}>
              <PieChart>
                <Pie data={activityTypeData} cx="50%" cy="50%" outerRadius={70} dataKey="value" label={({ name, percent }) => `${name} ${((percent ?? 0) * 100).toFixed(0)}%`} labelLine={false}>
                  {activityTypeData.map((_, i) => (
                    <Cell key={i} fill={COLORS[i % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip formatter={(v) => [v, 'Workouts']} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        )}
      </div>

      {/* Activity log */}
      <div className="bg-white rounded-xl border border-gray-200 p-5">
        <h2 className="font-semibold text-gray-900 mb-4">Activity Log</h2>
        {loading ? (
          <div className="py-8 text-center text-gray-400 text-sm">Loading...</div>
        ) : activities.length === 0 ? (
          <EmptyState message="No activities yet. Import a CSV to get started." />
        ) : (
          <div className="overflow-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-xs text-gray-400 border-b border-gray-100">
                  <th className="pb-2 font-medium">Date</th>
                  <th className="pb-2 font-medium">Activity</th>
                  <th className="pb-2 font-medium">Duration</th>
                  <th className="pb-2 font-medium">Distance</th>
                  <th className="pb-2 font-medium">Calories</th>
                  <th className="pb-2 font-medium">Avg HR</th>
                </tr>
              </thead>
              <tbody>
                {activities.map((a) => (
                  <tr key={a.id} className="border-b border-gray-50 hover:bg-gray-50">
                    <td className="py-2 text-gray-500">{format(parseISO(a.date), 'MMM d, yyyy')}</td>
                    <td className="py-2">
                      <span className="bg-green-100 text-green-700 text-xs px-2 py-0.5 rounded-full">
                        {a.activity_type}
                      </span>
                    </td>
                    <td className="py-2 text-gray-700">{a.duration_minutes ? `${a.duration_minutes} min` : '—'}</td>
                    <td className="py-2 text-gray-700">{a.distance_km ? `${a.distance_km.toFixed(2)} km` : '—'}</td>
                    <td className="py-2 text-gray-700">{a.calories ? `${a.calories} kcal` : '—'}</td>
                    <td className="py-2 text-gray-700">{a.heart_rate_avg ? `${a.heart_rate_avg} bpm` : '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}

function EmptyState({ message }: { message: string }) {
  return <div className="py-8 text-center"><p className="text-sm text-gray-400">{message}</p></div>
}
