import { Info, AlertTriangle, CheckCircle2 } from 'lucide-react'
import type { Insight } from '../api/insights'

const severityConfig = {
  info: {
    icon: Info,
    border: 'border-blue-200',
    bg: 'bg-blue-50',
    iconColor: 'text-blue-500',
    badge: 'bg-blue-100 text-blue-700',
    label: 'Info',
  },
  warning: {
    icon: AlertTriangle,
    border: 'border-amber-200',
    bg: 'bg-amber-50',
    iconColor: 'text-amber-500',
    badge: 'bg-amber-100 text-amber-700',
    label: 'Heads up',
  },
  positive: {
    icon: CheckCircle2,
    border: 'border-green-200',
    bg: 'bg-green-50',
    iconColor: 'text-green-500',
    badge: 'bg-green-100 text-green-700',
    label: 'Great',
  },
}

const categoryLabels: Record<string, string> = {
  finance: 'Finance',
  fitness: 'Fitness',
  habits: 'Habits',
  'cross-domain': 'Cross-domain',
}

export default function InsightCard({ insight }: { insight: Insight }) {
  const cfg = severityConfig[insight.severity]
  const Icon = cfg.icon

  return (
    <div className={`rounded-xl border p-5 ${cfg.border} ${cfg.bg}`}>
      <div className="flex items-start gap-3">
        <Icon size={20} className={`flex-shrink-0 mt-0.5 ${cfg.iconColor}`} />
        <div className="flex-1 min-w-0">
          <div className="flex flex-wrap items-center gap-2 mb-1">
            <h3 className="font-semibold text-gray-900 text-sm">{insight.title}</h3>
            <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${cfg.badge}`}>
              {cfg.label}
            </span>
            <span className="text-xs px-2 py-0.5 rounded-full bg-gray-100 text-gray-500 font-medium">
              {categoryLabels[insight.category] || insight.category}
            </span>
          </div>
          <p className="text-sm text-gray-700 leading-relaxed">{insight.description}</p>
        </div>
      </div>
    </div>
  )
}
