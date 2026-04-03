import { useEffect, useState } from 'react'
import {
  View, Text, ScrollView, StyleSheet, TouchableOpacity,
  RefreshControl, ActivityIndicator,
} from 'react-native'
import { getInsights } from '../../../src/lib/apiClient'
import type { Insight } from '../../../src/lib/apiClient'
import InsightCard from '../../../src/components/InsightCard'
import EmptyState from '../../../src/components/EmptyState'
import Colors from '../../../src/constants/colors'
import { useSafeAreaInsets } from 'react-native-safe-area-context'

const CATEGORY_ORDER = ['cross-domain', 'finance', 'fitness', 'habits']
const CATEGORY_LABELS: Record<string, string> = {
  finance: 'Finance',
  fitness: 'Fitness',
  habits: 'Habits',
  'cross-domain': 'Cross-Domain',
}

export default function InsightsScreen() {
  const insets = useSafeAreaInsets()
  const [insights, setInsights] = useState<Insight[]>([])
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [filter, setFilter] = useState('all')

  const load = async () => {
    try {
      const res = await getInsights()
      setInsights(res.data)
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }

  useEffect(() => { load() }, [])
  const onRefresh = () => { setRefreshing(true); load() }

  const categories = ['all', ...Array.from(new Set(insights.map((i) => i.category)))
    .sort((a, b) => CATEGORY_ORDER.indexOf(a) - CATEGORY_ORDER.indexOf(b))]

  const filtered = filter === 'all' ? insights : insights.filter((i) => i.category === filter)

  const grouped = CATEGORY_ORDER.reduce<Record<string, Insight[]>>((acc, cat) => {
    const items = filtered.filter((i) => i.category === cat)
    if (items.length) acc[cat] = items
    return acc
  }, {})

  if (loading) {
    return (
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: Colors.background }}>
        <ActivityIndicator color={Colors.primary} />
      </View>
    )
  }

  return (
    <ScrollView
      style={styles.screen}
      contentContainerStyle={[styles.content, { paddingTop: insets.top + 16 }]}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={Colors.primary} />}
    >
      <View style={styles.headerSection}>
        <Text style={styles.title}>Insights 💡</Text>
        <Text style={styles.subtitle}>Patterns and recommendations from your data</Text>
      </View>

      {/* Filter chips */}
      {insights.length > 0 && (
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.filterRow} contentContainerStyle={styles.filterContent}>
          {categories.map((cat) => (
            <TouchableOpacity
              key={cat}
              onPress={() => setFilter(cat)}
              style={[styles.chip, filter === cat && styles.chipActive]}
              activeOpacity={0.7}
            >
              <Text style={[styles.chipText, filter === cat && styles.chipTextActive]}>
                {cat === 'all' ? `All (${insights.length})` : CATEGORY_LABELS[cat] || cat}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      )}

      {/* Grouped insights */}
      {insights.length === 0 ? (
        <View style={styles.emptyContainer}>
          <EmptyState
            icon="🔍"
            message="No insights yet. Connect at least 2 data sources and check back after a few days of habit logging."
          />
        </View>
      ) : Object.keys(grouped).length === 0 ? (
        <EmptyState icon="🔍" message="No insights in this category." />
      ) : (
        Object.entries(grouped).map(([cat, items]) => (
          <View key={cat} style={styles.group}>
            <Text style={styles.groupLabel}>{CATEGORY_LABELS[cat] || cat}</Text>
            {items.map((insight) => <InsightCard key={insight.id} insight={insight} />)}
          </View>
        ))
      )}
    </ScrollView>
  )
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: Colors.background },
  content: { paddingHorizontal: 20, paddingBottom: 32 },
  headerSection: { marginBottom: 16 },
  title: { fontSize: 24, fontWeight: '700', color: Colors.text },
  subtitle: { fontSize: 13, color: Colors.textSecondary, marginTop: 3 },
  filterRow: { marginBottom: 16, marginHorizontal: -20 },
  filterContent: { paddingHorizontal: 20, gap: 8 },
  chip: {
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 100,
    backgroundColor: Colors.gray100,
  },
  chipActive: { backgroundColor: Colors.primary },
  chipText: { fontSize: 13, fontWeight: '600', color: Colors.gray600 },
  chipTextActive: { color: Colors.white },
  group: { marginBottom: 24 },
  groupLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: Colors.textMuted,
    letterSpacing: 0.8,
    textTransform: 'uppercase',
    marginBottom: 10,
  },
  emptyContainer: {
    backgroundColor: Colors.card,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: Colors.border,
    padding: 16,
  },
})
