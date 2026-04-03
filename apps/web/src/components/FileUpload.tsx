import { useRef, useState } from 'react'
import { Upload, FileText, CheckCircle2, XCircle } from 'lucide-react'

interface ImportResult {
  imported: number
  errors: number
  batch_id: string
  error_details: string[]
}

interface FileUploadProps {
  label: string
  description: string
  sampleHeaders: string
  onUpload: (file: File) => Promise<ImportResult>
}

export default function FileUpload({ label, description, sampleHeaders, onUpload }: FileUploadProps) {
  const inputRef = useRef<HTMLInputElement>(null)
  const [dragging, setDragging] = useState(false)
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<ImportResult | null>(null)
  const [error, setError] = useState<string | null>(null)

  const handleFile = async (file: File) => {
    if (!file.name.endsWith('.csv')) {
      setError('Only CSV files are supported.')
      return
    }
    setLoading(true)
    setResult(null)
    setError(null)
    try {
      const res = await onUpload(file)
      setResult(res)
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { detail?: string } } })?.response?.data?.detail || 'Upload failed'
      setError(msg)
    } finally {
      setLoading(false)
    }
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    setDragging(false)
    const file = e.dataTransfer.files[0]
    if (file) handleFile(file)
  }

  return (
    <div className="space-y-4">
      <div
        onDragOver={(e) => { e.preventDefault(); setDragging(true) }}
        onDragLeave={() => setDragging(false)}
        onDrop={handleDrop}
        onClick={() => inputRef.current?.click()}
        className={`border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-colors ${
          dragging ? 'border-indigo-400 bg-indigo-50' : 'border-gray-300 hover:border-indigo-400 hover:bg-gray-50'
        }`}
      >
        <input
          ref={inputRef}
          type="file"
          accept=".csv"
          className="hidden"
          onChange={(e) => { const f = e.target.files?.[0]; if (f) handleFile(f) }}
        />
        <Upload size={32} className="mx-auto text-gray-400 mb-3" />
        <p className="font-medium text-gray-700">{label}</p>
        <p className="text-sm text-gray-500 mt-1">{description}</p>
        <p className="text-xs text-gray-400 mt-3 font-mono bg-gray-100 rounded px-3 py-1.5 inline-block">
          {sampleHeaders}
        </p>
      </div>

      {loading && (
        <div className="flex items-center gap-2 text-sm text-indigo-600">
          <div className="w-4 h-4 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin" />
          Processing file...
        </div>
      )}

      {result && (
        <div className="rounded-lg border border-green-200 bg-green-50 p-4">
          <div className="flex items-center gap-2 mb-2">
            <CheckCircle2 size={18} className="text-green-600" />
            <span className="font-medium text-green-800">Import successful</span>
          </div>
          <div className="text-sm text-green-700 space-y-1">
            <div className="flex items-center gap-2">
              <FileText size={14} />
              <span>{result.imported} records imported (batch: {result.batch_id})</span>
            </div>
            {result.errors > 0 && (
              <p className="text-amber-700">{result.errors} rows had errors and were skipped.</p>
            )}
          </div>
          {result.error_details?.length > 0 && (
            <ul className="mt-2 text-xs text-amber-600 space-y-0.5">
              {result.error_details.map((e, i) => <li key={i}>• {e}</li>)}
            </ul>
          )}
        </div>
      )}

      {error && (
        <div className="rounded-lg border border-red-200 bg-red-50 p-4 flex items-start gap-2">
          <XCircle size={18} className="text-red-500 flex-shrink-0 mt-0.5" />
          <p className="text-sm text-red-700">{error}</p>
        </div>
      )}
    </div>
  )
}
