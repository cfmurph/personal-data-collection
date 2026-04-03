import { useEffect, useState } from 'react'
import { format, parseISO, subDays } from 'date-fns'
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from 'recharts'
import { importFinanceCSV, getTransactions, getFinanceSummary, type Transaction, type TransactionSummary } from '../api/finance'
import FileUpload from '../components/FileUpload'
import StatCard from '../components/StatCard'
import { DollarSign, TrendingUp, TrendingDown, RefreshCw } from 'lucide-react'

const COLORS = ['#6366f1', '#8b5cf6', '#ec4899', '#f59e0b', '#10b981', '#3b82f6', '#ef4444', '#14b8a6']

export default function FinancePage() {
  const [transactions, setTransactions] = useState<Transaction[]>([])
  const [summary, setSummary] = useState<TransactionSummary | null>(null)
  const [loading, setLoading] = useState(true)
  const [refreshKey, setRefreshKey] = useState(0)

  const thirtyDaysAgo = format(subDays(new Date(), 30), 'yyyy-MM-dd')

  useEffect(() => {
    setLoading(true)
    Promise.all([
      getTransactions({ start_date: thirtyDaysAgo, limit: 100 }),
      getFinanceSummary({ start_date: thirtyDaysAgo }),
    ])
      .then(([t, s]) => {
        setTransactions(t.data)
        setSummary(s.data)
      })
      .finally(() => setLoading(false))
  }, [refreshKey])

  const pieData = summary
    ? Object.entries(summary.by_category)
        .sort(([, a], [, b]) => b - a)
        .slice(0, 8)
        .map(([name, value]) => ({ name, value: Math.round(value * 100) / 100 }))
    : []

  return (
    <div className="space-y-6 max-w-6xl">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Finance</h1>
          <p className="text-gray-500 text-sm mt-1">Track your spending and income</p>
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
        <h2 className="font-semibold text-gray-900 mb-4">Import Financial Data</h2>
        <FileUpload
          label="Drop a financial CSV here or click to browse"
          description="Supports bank exports and custom CSVs"
          sampleHeaders="date, description, amount, category, account"
          onUpload={async (file) => {
            const res = await importFinanceCSV(file)
            setRefreshKey((k) => k + 1)
            return res.data
          }}
        />
      </div>

      {/* Summary cards */}
      {summary && (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <StatCard
            label="Total Spent (30 days)"
            value={`$${summary.total_spent.toFixed(2)}`}
            icon={<TrendingDown size={20} />}
            color="red"
          />
          <StatCard
            label="Total Income (30 days)"
            value={`$${summary.total_income.toFixed(2)}`}
            icon={<TrendingUp size={20} />}
            color="green"
          />
          <StatCard
            label="Net (30 days)"
            value={`${summary.net >= 0 ? '+' : ''}$${summary.net.toFixed(2)}`}
            sub={`${summary.transaction_count} transactions`}
            icon={<DollarSign size={20} />}
            color={summary.net >= 0 ? 'green' : 'red'}
          />
        </div>
      )}

      {/* Chart + table */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {pieData.length > 0 && (
          <div className="bg-white rounded-xl border border-gray-200 p-5">
            <h2 className="font-semibold text-gray-900 mb-4">Spending by Category</h2>
            <ResponsiveContainer width="100%" height={260}>
              <PieChart>
                <Pie data={pieData} cx="50%" cy="50%" outerRadius={90} dataKey="value" label={({ name, percent }) => `${name} ${((percent ?? 0) * 100).toFixed(0)}%`} labelLine={false}>
                  {pieData.map((_, i) => (
                    <Cell key={i} fill={COLORS[i % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip formatter={(v) => [`$${Number(v).toFixed(2)}`, 'Spent']} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        )}

        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <h2 className="font-semibold text-gray-900 mb-4">Recent Transactions</h2>
          {loading ? (
            <div className="py-8 text-center text-gray-400 text-sm">Loading...</div>
          ) : transactions.length === 0 ? (
            <div className="py-8 text-center text-gray-400 text-sm">No transactions yet. Import a CSV above.</div>
          ) : (
            <div className="overflow-auto max-h-80">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-left text-xs text-gray-400 border-b border-gray-100">
                    <th className="pb-2 font-medium">Date</th>
                    <th className="pb-2 font-medium">Description</th>
                    <th className="pb-2 font-medium">Category</th>
                    <th className="pb-2 font-medium text-right">Amount</th>
                  </tr>
                </thead>
                <tbody>
                  {transactions.map((t) => (
                    <tr key={t.id} className="border-b border-gray-50 hover:bg-gray-50">
                      <td className="py-2 text-gray-500">{format(parseISO(t.date), 'MMM d')}</td>
                      <td className="py-2 text-gray-800 max-w-[160px] truncate">{t.description}</td>
                      <td className="py-2">
                        {t.category && (
                          <span className="bg-gray-100 text-gray-600 text-xs px-2 py-0.5 rounded-full">
                            {t.category}
                          </span>
                        )}
                      </td>
                      <td className={`py-2 text-right font-medium ${t.amount < 0 ? 'text-red-600' : 'text-green-600'}`}>
                        {t.amount < 0 ? '-' : '+'}${Math.abs(t.amount).toFixed(2)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
