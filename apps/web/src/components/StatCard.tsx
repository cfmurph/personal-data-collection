interface StatCardProps {
  label: string
  value: string | number
  sub?: string
  icon?: React.ReactNode
  color?: string
}

export default function StatCard({ label, value, sub, icon, color = 'indigo' }: StatCardProps) {
  const colorMap: Record<string, string> = {
    indigo: 'bg-indigo-50 text-indigo-600',
    green: 'bg-green-50 text-green-600',
    orange: 'bg-orange-50 text-orange-600',
    red: 'bg-red-50 text-red-600',
    purple: 'bg-purple-50 text-purple-600',
    blue: 'bg-blue-50 text-blue-600',
  }

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-5 flex items-start gap-4">
      {icon && (
        <div className={`w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0 ${colorMap[color]}`}>
          {icon}
        </div>
      )}
      <div className="min-w-0">
        <p className="text-sm text-gray-500 font-medium">{label}</p>
        <p className="text-2xl font-bold text-gray-900 mt-0.5">{value}</p>
        {sub && <p className="text-xs text-gray-400 mt-1">{sub}</p>}
      </div>
    </div>
  )
}
