import { useEffect, useState } from 'react'
import {
  View, Text, ScrollView, StyleSheet, TouchableOpacity,
  RefreshControl, ActivityIndicator, Alert,
} from 'react-native'
import * as DocumentPicker from 'expo-document-picker'
import { format, parseISO, subDays } from 'date-fns'
import {
  importFitnessCSV, getFitnessActivities, getFitnessSummary,
} from '../../../src/lib/apiClient'
import type { FitnessActivity, FitnessSummary, ImportResult } from '../../../src/lib/apiClient'
import StatCard from '../../../src/components/StatCard'
import EmptyState from '../../../src/components/EmptyState'
import Colors from '../../../src/constants/colors'
import { useSafeAreaInsets } from 'react-native-safe-area-context'

export default function FitnessScreen() {
  const insets = useSafeAreaInsets()
  const [activities, setActivities] = useState<FitnessActivity[]>([])
  const [summary, setSummary] = useState<FitnessSummary | null>(null)
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [importing, setImporting] = useState(false)
  const [lastImport, setLastImport] = useState<ImportResult | null>(null)

  const thirtyDaysAgo = format(subDays(new Date(), 30), 'yyyy-MM-dd')

  const load = async () => {
    try {
      const [a, s] = await Promise.all([
        getFitnessActivities({ start_date: thirtyDaysAgo, limit: 50 }),
        getFitnessSummary({ start_date: thirtyDaysAgo }),
      ])
      setActivities(a.data)
      setSummary(s.data)
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }

  useEffect(() => { load() }, [])

  const onRefresh = () => { setRefreshing(true); load() }

  const handleImport = async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: 'text/comma-separated-values',
        copyToCacheDirectory: true,
      })
      if (result.canceled || !result.assets?.[0]) return

      const asset = result.assets[0]
      setImporting(true)

      const formData = new FormData()
      formData.append('file', {
        uri: asset.uri,
        name: asset.name,
        type: 'text/csv',
      } as unknown as Blob)

      const res = await importFitnessCSV(formData)
      setLastImport(res.data)
      Alert.alert(
        'Import complete',
        `${res.data.imported} activities imported${res.data.duplicates_skipped > 0 ? `, ${res.data.duplicates_skipped} duplicates skipped` : ''}.`
      )
      load()
    } catch {
      Alert.alert('Import failed', 'Please check your CSV format and try again.')
    } finally {
      setImporting(false)
    }
  }

  if (loading) {
    return (
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: Colors.background }}>
        <ActivityIndicator color={Colors.primary} />
      </View>
    )
  }

  const activityTypes: [string, number][] = summary
    ? (Object.entries(summary.by_activity_type).sort(([, a], [, b]) => (b as number) - (a as number)) as [string, number][])
    : []

  return (
    <ScrollView
      style={styles.screen}
      contentContainerStyle={[styles.content, { paddingTop: insets.top + 16 }]}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={Colors.primary} />}
    >
      <View style={styles.headerSection}>
        <Text style={styles.title}>Fitness</Text>
        <Text style={styles.subtitle}>Last 30 days</Text>
      </View>

      {/* Import */}
      <TouchableOpacity style={styles.importBtn} onPress={handleImport} disabled={importing} activeOpacity={0.85}>
        <Text style={styles.importBtnText}>{importing ? '⏳ Importing…' : '📂 Import CSV'}</Text>
        <Text style={styles.importBtnSub}>date, activity_type[, duration_minutes, calories, …]</Text>
      </TouchableOpacity>

      {lastImport && (
        <View style={styles.importResult}>
          <Text style={styles.importResultText}>
            ✓ {lastImport.imported} imported · {lastImport.duplicates_skipped} dupes skipped
          </Text>
        </View>
      )}

      {/* Summary */}
      {summary && (
        <>
          <View style={styles.statsRow}>
            <StatCard label="Workouts" value={summary.total_workouts} color="green" />
            <View style={{ width: 12 }} />
            <StatCard label="Duration" value={`${Math.round(summary.total_duration_minutes)}m`} color="blue" />
            <View style={{ width: 12 }} />
            <StatCard label="Calories" value={`${Math.round(summary.total_calories / 1000).toFixed(1)}k`} color="orange" />
          </View>

          {activityTypes.length > 0 && (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Activity Breakdown</Text>
              {activityTypes.map(([type, count]: [string, number]) => {
                const total = summary.total_workouts || 1
                const pct = (count / total) * 100
                return (
                  <View key={type} style={styles.actTypeRow}>
                    <Text style={styles.actTypeName}>{type}</Text>
                    <View style={styles.barTrack}>
                      <View style={[styles.barFill, { width: `${pct}%` }]} />
                    </View>
                    <Text style={styles.actTypeCount}>{count}x</Text>
                  </View>
                )
              })}
            </View>
          )}
        </>
      )}

      {/* Activity log */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Activity Log</Text>
        {activities.length === 0 ? (
          <EmptyState message="No activities yet. Import a fitness CSV." icon="🏃" />
        ) : (
          activities.slice(0, 30).map((a) => (
            <View key={a.id} style={styles.actRow}>
              <View style={[styles.actBadge, { backgroundColor: Colors.successLight }]}>
                <Text style={styles.actBadgeText}>{a.activity_type[0]}</Text>
              </View>
              <View style={styles.actInfo}>
                <Text style={styles.actType}>{a.activity_type}</Text>
                <Text style={styles.actDate}>{format(parseISO(a.date), 'MMM d, yyyy')}</Text>
              </View>
              <View style={styles.actMetrics}>
                    {a.duration_minutes != null ? <Text style={styles.actMetric}>{a.duration_minutes}min</Text> : null}
                    {a.calories != null ? <Text style={styles.actMetricSub}>{a.calories}kcal</Text> : null}
              </View>
            </View>
          ))
        )}
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
  importBtn: {
    backgroundColor: Colors.successLight,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#a7f3d0',
    borderStyle: 'dashed',
    padding: 18,
    alignItems: 'center',
    marginBottom: 12,
  },
  importBtnText: { fontSize: 15, fontWeight: '700', color: Colors.success },
  importBtnSub: { fontSize: 11, color: Colors.textMuted, marginTop: 4, fontFamily: 'monospace' },
  importResult: {
    backgroundColor: Colors.successLight,
    borderRadius: 10,
    padding: 10,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#a7f3d0',
  },
  importResultText: { fontSize: 13, color: Colors.success, fontWeight: '600', textAlign: 'center' },
  statsRow: { flexDirection: 'row', marginBottom: 16 },
  section: {
    backgroundColor: Colors.card,
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  sectionTitle: { fontSize: 15, fontWeight: '700', color: Colors.text, marginBottom: 12 },
  actTypeRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 10, gap: 8 },
  actTypeName: { fontSize: 13, color: Colors.text, width: 110 },
  barTrack: { flex: 1, height: 6, backgroundColor: Colors.gray100, borderRadius: 3 },
  barFill: { height: 6, backgroundColor: Colors.success, borderRadius: 3 },
  actTypeCount: { fontSize: 13, color: Colors.gray600, width: 30, textAlign: 'right' },
  actRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: Colors.gray100,
    gap: 12,
  },
  actBadge: { width: 36, height: 36, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  actBadgeText: { fontSize: 16, fontWeight: '700', color: Colors.success },
  actInfo: { flex: 1 },
  actType: { fontSize: 14, fontWeight: '600', color: Colors.text },
  actDate: { fontSize: 12, color: Colors.textMuted },
  actMetrics: { alignItems: 'flex-end' },
  actMetric: { fontSize: 13, color: Colors.gray700 },
  actMetricSub: { fontSize: 11, color: Colors.textMuted },
})
