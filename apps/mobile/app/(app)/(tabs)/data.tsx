import { useEffect, useState } from 'react'
import {
  View, Text, ScrollView, StyleSheet, TouchableOpacity,
  RefreshControl, ActivityIndicator, Alert,
} from 'react-native'
import { format, parseISO } from 'date-fns'
import { getDataSources, deleteDataSource, deleteAllFinance, deleteAllFitness } from '../../../src/lib/apiClient'
import type { DataSource } from '../../../src/lib/apiClient'
import EmptyState from '../../../src/components/EmptyState'
import Colors from '../../../src/constants/colors'
import { useSafeAreaInsets } from 'react-native-safe-area-context'

const SOURCE_LABELS: Record<string, string> = {
  finance_csv: 'Finance CSV',
  fitness_csv: 'Fitness CSV',
  manual_habit: 'Manual Habit',
}

const SOURCE_COLORS: Record<string, string> = {
  finance_csv: Colors.orange,
  fitness_csv: Colors.success,
  manual_habit: Colors.purple,
}

export default function DataScreen() {
  const insets = useSafeAreaInsets()
  const [sources, setSources] = useState<DataSource[]>([])
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [deleting, setDeleting] = useState<number | null>(null)

  const load = async () => {
    try {
      const res = await getDataSources()
      setSources(res.data)
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }

  useEffect(() => { load() }, [])
  const onRefresh = () => { setRefreshing(true); load() }

  const handleDeleteSource = (source: DataSource) => {
    Alert.alert(
      'Remove import',
      `Delete "${source.label || SOURCE_LABELS[source.source_type]}" (${source.record_count} records)?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            setDeleting(source.id)
            try {
              await deleteDataSource(source.id)
              load()
            } catch {
              Alert.alert('Error', 'Failed to delete. Try again.')
            } finally {
              setDeleting(null)
            }
          },
        },
      ]
    )
  }

  const handleDeleteAll = (type: 'finance' | 'fitness') => {
    Alert.alert(
      `Delete all ${type} data`,
      'This will permanently delete all records. This cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete All',
          style: 'destructive',
          onPress: async () => {
            try {
              if (type === 'finance') await deleteAllFinance()
              else await deleteAllFitness()
              Alert.alert('Done', `All ${type} data deleted.`)
              load()
            } catch {
              Alert.alert('Error', 'Delete failed.')
            }
          },
        },
      ]
    )
  }

  if (loading) {
    return (
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: Colors.background }}>
        <ActivityIndicator color={Colors.primary} />
      </View>
    )
  }

  const financeCount = sources.filter((s) => s.source_type === 'finance_csv').reduce((a, s) => a + s.record_count, 0)
  const fitnessCount = sources.filter((s) => s.source_type === 'fitness_csv').reduce((a, s) => a + s.record_count, 0)

  return (
    <ScrollView
      style={styles.screen}
      contentContainerStyle={[styles.content, { paddingTop: insets.top + 16 }]}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={Colors.primary} />}
    >
      <View style={styles.headerSection}>
        <Text style={styles.title}>Data Management</Text>
        <Text style={styles.subtitle}>View and delete your imported data</Text>
      </View>

      {/* Summary counts */}
      <View style={styles.statsRow}>
        <View style={[styles.statBox, { borderColor: '#fed7aa' }]}>
          <Text style={[styles.statCount, { color: Colors.orange }]}>{financeCount.toLocaleString()}</Text>
          <Text style={styles.statLabel}>Transactions</Text>
          {financeCount > 0 && (
            <TouchableOpacity onPress={() => handleDeleteAll('finance')}>
              <Text style={styles.deleteAllText}>Delete all</Text>
            </TouchableOpacity>
          )}
        </View>
        <View style={{ width: 12 }} />
        <View style={[styles.statBox, { borderColor: '#a7f3d0' }]}>
          <Text style={[styles.statCount, { color: Colors.success }]}>{fitnessCount.toLocaleString()}</Text>
          <Text style={styles.statLabel}>Activities</Text>
          {fitnessCount > 0 && (
            <TouchableOpacity onPress={() => handleDeleteAll('fitness')}>
              <Text style={styles.deleteAllText}>Delete all</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>

      {/* Import history */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Import History</Text>
        {sources.length === 0 ? (
          <EmptyState message="No imports yet." icon="📂" />
        ) : (
          sources.map((source) => (
            <View key={source.id} style={styles.sourceRow}>
              <View style={[styles.sourceType, { backgroundColor: (SOURCE_COLORS[source.source_type] || Colors.gray400) + '20' }]}>
                <Text style={[styles.sourceTypeText, { color: SOURCE_COLORS[source.source_type] || Colors.gray400 }]}>
                  {SOURCE_LABELS[source.source_type]?.[0] || '?'}
                </Text>
              </View>
              <View style={styles.sourceInfo}>
                <Text style={styles.sourceName} numberOfLines={1}>
                  {source.label || SOURCE_LABELS[source.source_type]}
                </Text>
                <Text style={styles.sourceMeta}>
                  {source.record_count} records
                  {source.meta?.start_date ? ` · ${String(source.meta.start_date)} → ${String(source.meta.end_date)}` : ''}
                </Text>
                <Text style={styles.sourceDate}>
                  Imported {format(parseISO(source.created_at), 'MMM d, yyyy')}
                  {Number(source.meta?.duplicates_skipped || 0) > 0 ? ` · ${source.meta?.duplicates_skipped} dupes skipped` : ''}
                </Text>
              </View>
              <TouchableOpacity
                onPress={() => handleDeleteSource(source)}
                disabled={deleting === source.id}
                style={styles.deleteBtn}
              >
                {deleting === source.id ? (
                  <ActivityIndicator size="small" color={Colors.danger} />
                ) : (
                  <Text style={styles.deleteBtnText}>🗑</Text>
                )}
              </TouchableOpacity>
            </View>
          ))
        )}
      </View>

      {/* Privacy note */}
      <View style={styles.privacyNote}>
        <Text style={styles.privacyText}>
          🔒 Your data is stored privately and never shared. Delete any import at any time.
        </Text>
      </View>
    </ScrollView>
  )
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: Colors.background },
  content: { paddingHorizontal: 20, paddingBottom: 32 },
  headerSection: { marginBottom: 16 },
  title: { fontSize: 24, fontWeight: '700', color: Colors.text },
  subtitle: { fontSize: 13, color: Colors.textSecondary, marginTop: 3 },
  statsRow: { flexDirection: 'row', marginBottom: 16 },
  statBox: {
    flex: 1,
    backgroundColor: Colors.card,
    borderRadius: 16,
    borderWidth: 1,
    padding: 16,
    alignItems: 'center',
  },
  statCount: { fontSize: 28, fontWeight: '800', marginBottom: 2 },
  statLabel: { fontSize: 12, color: Colors.textSecondary },
  deleteAllText: { fontSize: 12, color: Colors.danger, fontWeight: '600', marginTop: 8 },
  section: {
    backgroundColor: Colors.card,
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  sectionTitle: { fontSize: 15, fontWeight: '700', color: Colors.text, marginBottom: 14 },
  sourceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: Colors.gray100,
    gap: 12,
  },
  sourceType: {
    width: 38,
    height: 38,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  sourceTypeText: { fontSize: 14, fontWeight: '800' },
  sourceInfo: { flex: 1 },
  sourceName: { fontSize: 14, fontWeight: '600', color: Colors.text },
  sourceMeta: { fontSize: 12, color: Colors.textSecondary, marginTop: 2 },
  sourceDate: { fontSize: 11, color: Colors.textMuted, marginTop: 1 },
  deleteBtn: { width: 36, height: 36, alignItems: 'center', justifyContent: 'center' },
  deleteBtnText: { fontSize: 18 },
  privacyNote: {
    backgroundColor: '#eff6ff',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#bfdbfe',
    padding: 14,
  },
  privacyText: { fontSize: 13, color: '#1d4ed8', lineHeight: 19 },
})
