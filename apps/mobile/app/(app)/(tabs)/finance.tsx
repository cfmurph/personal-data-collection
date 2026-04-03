import { useEffect, useState } from 'react'
import {
  View, Text, ScrollView, StyleSheet, TouchableOpacity,
  RefreshControl, ActivityIndicator, Alert,
} from 'react-native'
import * as DocumentPicker from 'expo-document-picker'
import { format, parseISO, subDays } from 'date-fns'
import {
  importFinanceCSV, getTransactions, getFinanceSummary,
} from '../../../src/lib/apiClient'
import type { Transaction, TransactionSummary, ImportResult } from '../../../src/lib/apiClient'
import StatCard from '../../../src/components/StatCard'
import EmptyState from '../../../src/components/EmptyState'
import Colors from '../../../src/constants/colors'
import { useSafeAreaInsets } from 'react-native-safe-area-context'

export default function FinanceScreen() {
  const insets = useSafeAreaInsets()
  const [transactions, setTransactions] = useState<Transaction[]>([])
  const [summary, setSummary] = useState<TransactionSummary | null>(null)
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [importing, setImporting] = useState(false)
  const [lastImport, setLastImport] = useState<ImportResult | null>(null)

  const thirtyDaysAgo = format(subDays(new Date(), 30), 'yyyy-MM-dd')

  const load = async () => {
    try {
      const [t, s] = await Promise.all([
        getTransactions({ start_date: thirtyDaysAgo, limit: 50 }),
        getFinanceSummary({ start_date: thirtyDaysAgo }),
      ])
      setTransactions(t.data)
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

      const res = await importFinanceCSV(formData)
      setLastImport(res.data)
      Alert.alert(
        'Import complete',
        `${res.data.imported} records imported${res.data.duplicates_skipped > 0 ? `, ${res.data.duplicates_skipped} duplicates skipped` : ''}.`
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

  const topCategories: [string, number][] = summary
    ? Object.entries(summary.by_category).sort(([, a], [, b]) => (b as number) - (a as number)).slice(0, 5) as [string, number][]
    : []

  return (
    <ScrollView
      style={styles.screen}
      contentContainerStyle={[styles.content, { paddingTop: insets.top + 16 }]}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={Colors.primary} />}
    >
      <View style={styles.headerSection}>
        <Text style={styles.title}>Finance</Text>
        <Text style={styles.subtitle}>Last 30 days</Text>
      </View>

      {/* Import button */}
      <TouchableOpacity style={styles.importBtn} onPress={handleImport} disabled={importing} activeOpacity={0.85}>
        <Text style={styles.importBtnText}>{importing ? '⏳ Importing…' : '📂 Import CSV'}</Text>
        <Text style={styles.importBtnSub}>date, description, amount[, category, account]</Text>
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
        <View style={styles.statsRow}>
          <StatCard label="Spent" value={`$${summary.total_spent.toFixed(0)}`} color="red" />
          <View style={{ width: 12 }} />
          <StatCard label="Income" value={`$${summary.total_income.toFixed(0)}`} color="green" />
          <View style={{ width: 12 }} />
          <StatCard
            label="Net"
            value={`${summary.net >= 0 ? '+' : ''}$${summary.net.toFixed(0)}`}
            color={summary.net >= 0 ? 'green' : 'red'}
          />
        </View>
      )}

      {/* Top categories */}
      {topCategories.length > 0 && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Spending by Category</Text>
          {topCategories.map(([cat, amt]: [string, number]) => {
            const pct = summary ? (amt / summary.total_spent) * 100 : 0
            return (
              <View key={cat} style={styles.categoryRow}>
                <Text style={styles.categoryName}>{cat}</Text>
                <View style={styles.barTrack}>
                  <View style={[styles.barFill, { width: `${pct}%` }]} />
                </View>
                <Text style={styles.categoryAmt}>${amt.toFixed(0)}</Text>
              </View>
            )
          })}
        </View>
      )}

      {/* Transactions */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Recent Transactions</Text>
        {transactions.length === 0 ? (
          <EmptyState message="No transactions yet. Import a CSV above." icon="💳" />
        ) : (
          transactions.slice(0, 30).map((t) => (
            <View key={t.id} style={styles.txRow}>
              <View style={styles.txLeft}>
                <Text style={styles.txDesc} numberOfLines={1}>{t.description}</Text>
                <Text style={styles.txMeta}>
                  {format(parseISO(t.date), 'MMM d')}{t.category ? ` · ${t.category}` : ''}
                </Text>
              </View>
              <Text style={[styles.txAmt, t.amount < 0 ? styles.txNeg : styles.txPos]}>
                {t.amount < 0 ? '-' : '+'}${Math.abs(t.amount).toFixed(2)}
              </Text>
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
    backgroundColor: Colors.primaryLight,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#c7d2fe',
    borderStyle: 'dashed',
    padding: 18,
    alignItems: 'center',
    marginBottom: 12,
  },
  importBtnText: { fontSize: 15, fontWeight: '700', color: Colors.primary },
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
  categoryRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 10, gap: 8 },
  categoryName: { fontSize: 13, color: Colors.text, width: 110 },
  barTrack: { flex: 1, height: 6, backgroundColor: Colors.gray100, borderRadius: 3 },
  barFill: { height: 6, backgroundColor: Colors.primary, borderRadius: 3 },
  categoryAmt: { fontSize: 13, color: Colors.gray600, width: 50, textAlign: 'right' },
  txRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: Colors.gray100,
  },
  txLeft: { flex: 1, marginRight: 8 },
  txDesc: { fontSize: 14, color: Colors.text, fontWeight: '500' },
  txMeta: { fontSize: 12, color: Colors.textMuted, marginTop: 2 },
  txAmt: { fontSize: 14, fontWeight: '700' },
  txNeg: { color: Colors.danger },
  txPos: { color: Colors.success },
})
