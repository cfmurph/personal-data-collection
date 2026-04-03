import { View, Text, StyleSheet } from 'react-native'
import type { Insight } from '../lib/apiClient'
import Colors from '../constants/colors'

const severityConfig = {
  info: {
    border: '#bfdbfe',
    bg: '#eff6ff',
    badge: '#dbeafe',
    badgeText: '#1d4ed8',
    dot: '#3b82f6',
    label: 'Info',
  },
  warning: {
    border: '#fde68a',
    bg: '#fffbeb',
    badge: '#fef3c7',
    badgeText: '#92400e',
    dot: Colors.warning,
    label: 'Heads up',
  },
  positive: {
    border: '#a7f3d0',
    bg: Colors.successLight,
    badge: '#d1fae5',
    badgeText: '#065f46',
    dot: Colors.success,
    label: 'Great',
  },
}

const categoryLabels: Record<string, string> = {
  finance: 'Finance',
  fitness: 'Fitness',
  habits: 'Habits',
  'cross-domain': 'Cross-Domain',
}

export default function InsightCard({ insight }: { insight: Insight }) {
  const cfg = severityConfig[insight.severity as keyof typeof severityConfig]
  return (
    <View style={[styles.card, { borderColor: cfg.border, backgroundColor: cfg.bg }]}>
      <View style={styles.header}>
        <View style={[styles.dot, { backgroundColor: cfg.dot }]} />
        <Text style={styles.title} numberOfLines={2}>{insight.title}</Text>
      </View>
      <View style={styles.badges}>
        <View style={[styles.badge, { backgroundColor: cfg.badge }]}>
          <Text style={[styles.badgeText, { color: cfg.badgeText }]}>{cfg.label}</Text>
        </View>
        <View style={[styles.badge, { backgroundColor: Colors.gray100 }]}>
          <Text style={[styles.badgeText, { color: Colors.gray600 }]}>
            {categoryLabels[insight.category] || insight.category}
          </Text>
        </View>
      </View>
      <Text style={styles.description}>{insight.description}</Text>
    </View>
  )
}

const styles = StyleSheet.create({
  card: {
    borderRadius: 14,
    borderWidth: 1,
    padding: 14,
    marginBottom: 10,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
    marginBottom: 6,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginTop: 5,
    flexShrink: 0,
  },
  title: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.text,
    flex: 1,
  },
  badges: {
    flexDirection: 'row',
    gap: 6,
    marginBottom: 8,
  },
  badge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 100,
  },
  badgeText: {
    fontSize: 11,
    fontWeight: '600',
  },
  description: {
    fontSize: 13,
    color: Colors.gray700,
    lineHeight: 19,
  },
})
