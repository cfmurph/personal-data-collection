import { useEffect, useState } from 'react'
import { getInsights, type Insight } from '../api/insights'
import InsightCard from '../components/InsightCard'
import { Lightbulb, RefreshCw } from 'lucide-react'

const CATEGORY_ORDER = ['cross-domain', 'finance', 'fitness', 'habits']

export default function InsightsPage() {
  const [insights, setInsights] = useState<Insight[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState<string>('all')

  const load = () => {
    setLoading(true)
    getInsights()
      .then((res) => setInsights(res.data))
      .finally(() => setLoading(false))
  }

  useEffect(() => { load() }, [])

  const categories = ['all', ...Array.from(new Set(insights.map((i) => i.category))).sort(
    (a, b) => CATEGORY_ORDER.indexOf(a) - CATEGORY_ORDER.indexOf(b)
  )]

  const filtered = filter === 'all' ? insights : insights.filter((i) => i.category === filter)

  const grouped = CATEGORY_ORDER.reduce<Record<string, Insight[]>>((acc, cat) => {
    const items = filtered.filter((i) => i.category === cat)
    if (items.length) acc[cat] = items
    return acc
  }, {})
  // catch any categories not in the order list
  filtered.forEach((i) => {
    if (!CATEGORY_ORDER.includes(i.category)) {
      if (!grouped[i.category]) grouped[i.category] = []
      if (!grouped[i.category].includes(i)) grouped[i.category].push(i)
    }
  })

  const categoryLabels: Record<string, string> = {
    finance: 'Finance',
    fitness: 'Fitness',
    habits: 'Habits',
    'cross-domain': 'Cross-Domain',
  }

  return (
    <div className="space-y-6 max-w-3xl">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Insights</h1>
          <p className="text-gray-500 text-sm mt-1">Personalized patterns and recommendations from your data</p>
        </div>
        <button
          onClick={load}
          className="flex items-center gap-2 text-sm text-gray-600 hover:text-gray-900 border border-gray-300 rounded-lg px-3 py-2 hover:bg-gray-50 transition-colors"
        >
          <RefreshCw size={14} /> Refresh
        </button>
      </div>

      {/* Filter tabs */}
      {insights.length > 0 && (
        <div className="flex gap-2 flex-wrap">
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => setFilter(cat)}
              className={`px-3 py-1.5 rounded-full text-sm font-medium transition-colors ${
                filter === cat
                  ? 'bg-indigo-600 text-white'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              {cat === 'all' ? `All (${insights.length})` : categoryLabels[cat] || cat}
            </button>
          ))}
        </div>
      )}

      {loading ? (
        <div className="flex items-center justify-center h-40">
          <div className="w-8 h-8 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin" />
        </div>
      ) : insights.length === 0 ? (
        <div className="bg-white rounded-xl border border-gray-200 p-12 text-center">
          <Lightbulb size={40} className="text-gray-300 mx-auto mb-4" />
          <h3 className="font-semibold text-gray-700 mb-2">No insights yet</h3>
          <p className="text-sm text-gray-400 max-w-sm mx-auto">
            Connect at least 2 data sources (finance + fitness or habits) and check back.
            Insights are generated from at least 3 days of habit data or 30 days of financial/fitness history.
          </p>
        </div>
      ) : (
        <div className="space-y-8">
          {Object.entries(grouped).map(([cat, items]) => (
            <div key={cat}>
              <h2 className="text-sm font-semibold text-gray-400 uppercase tracking-wider mb-3">
                {categoryLabels[cat] || cat}
              </h2>
              <div className="space-y-3">
                {items.map((insight) => (
                  <InsightCard key={insight.id} insight={insight} />
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
