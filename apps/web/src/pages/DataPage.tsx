import { useEffect, useState } from 'react'
import { format, parseISO } from 'date-fns'
import toast from 'react-hot-toast'
import { getDataSources, deleteDataSource, type DataSource } from '../api/data_sources'
import { deleteAllFinance } from '../api/finance'
import { deleteAllFitness } from '../api/fitness'
import React from 'react'
import { Database, Trash2, TrendingUp, Dumbbell, Heart, RefreshCw, AlertTriangle } from 'lucide-react'

const SOURCE_ICONS: Record<string, React.ReactNode> = {
  finance_csv: <TrendingUp size={16} className="text-orange-500" />,
  fitness_csv: <Dumbbell size={16} className="text-green-500" />,
  manual_habit: <Heart size={16} className="text-pink-500" />,
}

const SOURCE_LABELS: Record<string, string> = {
  finance_csv: 'Finance CSV',
  fitness_csv: 'Fitness CSV',
  manual_habit: 'Manual Habit',
}

export default function DataPage() {
  const [sources, setSources] = useState<DataSource[]>([])
  const [loading, setLoading] = useState(true)
  const [deleting, setDeleting] = useState<number | null>(null)
  const [confirmDelete, setConfirmDelete] = useState<'finance' | 'fitness' | null>(null)

  const load = () => {
    setLoading(true)
    getDataSources()
      .then((res) => setSources(res.data))
      .finally(() => setLoading(false))
  }

  useEffect(() => { load() }, [])

  const handleDeleteSource = async (id: number) => {
    setDeleting(id)
    try {
      await deleteDataSource(id)
      toast.success('Data source removed')
      load()
    } catch {
      toast.error('Failed to delete data source')
    } finally {
      setDeleting(null)
    }
  }

  const handleDeleteAll = async (type: 'finance' | 'fitness') => {
    try {
      if (type === 'finance') await deleteAllFinance()
      else await deleteAllFitness()
      toast.success(`All ${type} data deleted`)
      setConfirmDelete(null)
      load()
    } catch {
      toast.error('Delete failed')
    }
  }

  const financeCount = sources.filter((s) => s.source_type === 'finance_csv').reduce((a, s) => a + s.record_count, 0)
  const fitnessCount = sources.filter((s) => s.source_type === 'fitness_csv').reduce((a, s) => a + s.record_count, 0)

  return (
    <div className="space-y-6 max-w-3xl">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Data Management</h1>
          <p className="text-gray-500 text-sm mt-1">View, manage, and delete your imported data sources</p>
        </div>
        <button
          onClick={load}
          className="flex items-center gap-2 text-sm text-gray-600 hover:text-gray-900 border border-gray-300 rounded-lg px-3 py-2 hover:bg-gray-50 transition-colors"
        >
          <RefreshCw size={14} /> Refresh
        </button>
      </div>

      {/* Summary */}
      <div className="grid grid-cols-2 gap-4">
        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <div className="flex items-center gap-2 mb-2">
            <TrendingUp size={18} className="text-orange-500" />
            <span className="font-semibold text-gray-900">Finance</span>
          </div>
          <p className="text-3xl font-bold text-gray-900">{financeCount.toLocaleString()}</p>
          <p className="text-sm text-gray-400 mt-1">transactions across {sources.filter(s => s.source_type === 'finance_csv').length} imports</p>
          {financeCount > 0 && (
            <button
              onClick={() => setConfirmDelete('finance')}
              className="mt-3 text-xs text-red-500 hover:text-red-700 font-medium flex items-center gap-1"
            >
              <Trash2 size={12} /> Delete all finance data
            </button>
          )}
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <div className="flex items-center gap-2 mb-2">
            <Dumbbell size={18} className="text-green-500" />
            <span className="font-semibold text-gray-900">Fitness</span>
          </div>
          <p className="text-3xl font-bold text-gray-900">{fitnessCount.toLocaleString()}</p>
          <p className="text-sm text-gray-400 mt-1">activities across {sources.filter(s => s.source_type === 'fitness_csv').length} imports</p>
          {fitnessCount > 0 && (
            <button
              onClick={() => setConfirmDelete('fitness')}
              className="mt-3 text-xs text-red-500 hover:text-red-700 font-medium flex items-center gap-1"
            >
              <Trash2 size={12} /> Delete all fitness data
            </button>
          )}
        </div>
      </div>

      {/* Confirm delete modal */}
      {confirmDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="bg-white rounded-2xl shadow-xl p-6 max-w-sm w-full mx-4">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-full bg-red-100 flex items-center justify-center">
                <AlertTriangle size={20} className="text-red-600" />
              </div>
              <h3 className="font-semibold text-gray-900">Delete all {confirmDelete} data?</h3>
            </div>
            <p className="text-sm text-gray-600 mb-6">
              This will permanently delete all {confirmDelete} records. This action cannot be undone.
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setConfirmDelete(null)}
                className="flex-1 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={() => handleDeleteAll(confirmDelete)}
                className="flex-1 py-2 bg-red-600 hover:bg-red-700 rounded-lg text-sm font-medium text-white transition-colors"
              >
                Delete All
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Data sources list */}
      <div className="bg-white rounded-xl border border-gray-200 p-5">
        <div className="flex items-center gap-2 mb-4">
          <Database size={18} className="text-gray-500" />
          <h2 className="font-semibold text-gray-900">Import History</h2>
        </div>

        {loading ? (
          <div className="py-8 text-center text-gray-400 text-sm">Loading...</div>
        ) : sources.length === 0 ? (
          <div className="py-8 text-center">
            <Database size={36} className="text-gray-200 mx-auto mb-3" />
            <p className="text-sm text-gray-400">No data sources yet. Import a CSV to get started.</p>
          </div>
        ) : (
          <div className="space-y-2">
            {sources.map((source) => (
              <div
                key={source.id}
                className="flex items-center gap-4 p-3 rounded-lg border border-gray-100 hover:bg-gray-50 transition-colors"
              >
                <div className="w-8 h-8 rounded-lg bg-gray-100 flex items-center justify-center flex-shrink-0">
                  {(SOURCE_ICONS[source.source_type] as React.ReactElement) || <Database size={16} className="text-gray-500" />}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="text-sm font-medium text-gray-900 truncate">
                      {source.label || SOURCE_LABELS[source.source_type] || source.source_type}
                    </p>
                    <span className="text-xs bg-gray-100 text-gray-500 px-2 py-0.5 rounded-full flex-shrink-0">
                      {SOURCE_LABELS[source.source_type] || source.source_type}
                    </span>
                  </div>
                  <div className="flex items-center gap-3 mt-0.5">
                    <span className="text-xs text-gray-400">{source.record_count.toLocaleString()} records</span>
                    {!!source.meta?.start_date && (
                      <span className="text-xs text-gray-400">
                        {String(source.meta.start_date)} → {String(source.meta.end_date)}
                      </span>
                    )}
                    {Number(source.meta?.duplicates_skipped ?? 0) > 0 && (
                      <span className="text-xs text-amber-600">
                        {Number(source.meta?.duplicates_skipped)} duplicates skipped
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-gray-300 mt-0.5">
                    Imported {format(parseISO(source.created_at), 'MMM d, yyyy')} · batch {source.batch_id}
                  </p>
                </div>
                <button
                  onClick={() => handleDeleteSource(source.id)}
                  disabled={deleting === source.id}
                  className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors disabled:opacity-50 flex-shrink-0"
                  title="Remove this import"
                >
                  {deleting === source.id ? (
                    <div className="w-4 h-4 border-2 border-red-400 border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <Trash2 size={16} />
                  )}
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Privacy note */}
      <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 text-sm text-blue-700">
        <strong>Your data stays yours.</strong> All data is stored locally in your account and never shared.
        You can delete any import at any time, and all associated records will be permanently removed.
      </div>
    </div>
  )
}
