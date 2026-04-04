interface StreakBadgeProps {
  current: number
  best: number
  total: number
  size?: 'sm' | 'lg'
}

export default function StreakBadge({ current, best, total, size = 'sm' }: StreakBadgeProps) {
  if (size === 'lg') {
    return (
      <div className="bg-gradient-to-r from-orange-50 to-amber-50 border border-orange-200 rounded-xl p-4">
        <div className="flex items-center gap-3 mb-3">
          <span className="text-3xl">🔥</span>
          <div>
            <p className="text-2xl font-bold text-orange-600">{current} day{current !== 1 ? 's' : ''}</p>
            <p className="text-sm text-orange-500 font-medium">Current streak</p>
          </div>
        </div>
        <div className="flex gap-4 text-sm">
          <div className="text-center">
            <p className="font-bold text-gray-700">{best}</p>
            <p className="text-gray-400 text-xs">Best streak</p>
          </div>
          <div className="w-px bg-orange-200" />
          <div className="text-center">
            <p className="font-bold text-gray-700">{total}</p>
            <p className="text-gray-400 text-xs">Total days logged</p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="flex items-center gap-2 bg-orange-50 border border-orange-200 rounded-lg px-3 py-1.5">
      <span className="text-base">🔥</span>
      <span className="text-sm font-bold text-orange-600">{current}</span>
      <span className="text-xs text-orange-400">day streak</span>
      {best > current && (
        <span className="text-xs text-gray-400 ml-1">· best {best}</span>
      )}
    </div>
  )
}
