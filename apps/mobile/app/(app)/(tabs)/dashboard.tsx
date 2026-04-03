import { useEffect, useState } from 'react'
import { View, Text, ScrollView, StyleSheet, TouchableOpacity, RefreshControl, ActivityIndicator } from 'react-native'
import { Link } from 'expo-router'
import { format, parseISO } from 'date-fns'
import { getDashboardSummary, getInsights } from '../../../src/lib/apiClient'
import type { DashboardSummary, Insight } from '../../../src/lib/apiClient'
import StatCard from '../../../src/components/StatCard'
import InsightCard from '../../../src/components/InsightCard'
import EmptyState from '../../../src/components/EmptyState'
import { useAuth } from '../../../src/context/AuthContext'
import Colors from '../../../src/constants/colors'
import { useSafeAreaInsets } from 'react-native-safe-area-context'

export default function DashboardScreen() {
  const { user } = useAuth()
  const insets = useSafeAreaInsets()
  const [summary, setSummary] = useState<DashboardSummary | null>(null)
  const [insights, setInsights] = useState<Insight[]>([])
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)

  const load = async () => {
    try {
      const [s, i] = await Promise.all([getDashboardSummary(), getInsights()])
      setSummary(s.data)
      setInsights(i.data)
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }

  useEffect(() => { load() }, [])

  const onRefresh = () => { setRefreshing(true); load() }

  if (loading) {
    return (
      <View style={[styles.center, { paddingTop: insets.top }]}>
        <ActivityIndicator size="large" color={Colors.primary} />
      </View>
    )
  }

  const hour = new Date().getHours()
  const greeting = hour < 12 ? 'morning' : hour < 17 ? 'afternoon' : 'evening'
  const today = format(new Date(), 'EEEE, MMMM d')

  const hasNoData = !summary ||
    (summary.finance.transaction_count === 0 &&
      summary.fitness.workouts_30_days === 0 &&
      summary.habits.entries_7_days === 0)

  return (
    <ScrollView
      style={styles.screen}
      contentContainerStyle={[styles.content, { paddingTop: insets.top + 16 }]}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={Colors.primary} />}
    >
      {/* Header */}
      <View style={styles.headerSection}>
        <Text style={styles.greeting}>Good {greeting}, {user?.username} 👋</Text>
        <Text style={styles.date}>{today}</Text>
      </View>

      {/* Onboarding prompt */}
      {hasNoData && (
        <View style={styles.onboarding}>
          <Text style={styles.onboardingTitle}>Get started</Text>
          <Text style={styles.onboardingText}>
            Import finance and fitness data, then log your first daily check-in to unlock insights.
          </Text>
          <Link href="/(app)/(tabs)/finance" asChild>
            <TouchableOpacity style={styles.onboardingBtn}>
              <Text style={styles.onboardingBtnText}>Import your first CSV →</Text>
            </TouchableOpacity>
          </Link>
        </View>
      )}

      {/* Stats */}
      <View style={styles.statsGrid}>
        <View style={styles.statsRow}>
          <StatCard
            label="Spent (30d)"
            value={`$${(summary?.finance.spend_30_days ?? 0).toFixed(0)}`}
            sub={`$${(summary?.finance.spend_7_days ?? 0).toFixed(0)} this week`}
            color="orange"
          />
          <View style={{ width: 12 }} />
          <StatCard
            label="Workouts (30d)"
            value={summary?.fitness.workouts_30_days ?? 0}
            sub={`${summary?.fitness.workouts_7_days ?? 0} this week`}
            color="green"
          />
        </View>
        <View style={[styles.statsRow, { marginTop: 12 }]}>
          <StatCard
            label="Avg Mood (7d)"
            value={summary?.habits.avg_mood_7_days != null ? `${summary.habits.avg_mood_7_days.toFixed(1)}/5` : '—'}
            sub={`${summary?.habits.entries_7_days ?? 0} check-ins`}
            color="purple"
          />
          <View style={{ width: 12 }} />
          <StatCard
            label="Avg Energy (7d)"
            value={summary?.habits.avg_energy_7_days != null ? `${summary.habits.avg_energy_7_days.toFixed(1)}/5` : '—'}
            sub={summary?.habits.today_logged ? '✓ Logged today' : 'Not logged today'}
            color="blue"
          />
        </View>
      </View>

      {/* Today's habit prompt */}
      {!summary?.habits.today_logged && (
        <Link href="/(app)/(tabs)/habits" asChild>
          <TouchableOpacity style={styles.habitPrompt} activeOpacity={0.85}>
            <Text style={styles.habitPromptTitle}>Log today's check-in</Text>
            <Text style={styles.habitPromptSub}>Track mood, energy & focus →</Text>
          </TouchableOpacity>
        </Link>
      )}

      {/* Recent workouts */}
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Recent Workouts</Text>
          <Link href="/(app)/(tabs)/fitness" asChild>
            <TouchableOpacity><Text style={styles.seeAll}>See all</Text></TouchableOpacity>
          </Link>
        </View>
        {summary?.fitness.recent_activities.length ? (
          summary.fitness.recent_activities.map((a, idx) => (
            <View key={idx} style={styles.activityRow}>
              <View style={styles.activityDot} />
              <View style={styles.activityInfo}>
                <Text style={styles.activityType}>{a.activity_type}</Text>
                <Text style={styles.activityDate}>{format(parseISO(a.date), 'MMM d')}</Text>
              </View>
              <View style={styles.activityRight}>
                {a.duration_minutes ? <Text style={styles.activityValue}>{a.duration_minutes} min</Text> : null}
                {a.calories ? <Text style={styles.activitySub}>{a.calories} kcal</Text> : null}
              </View>
            </View>
          ))
        ) : (
          <EmptyState message="No workouts yet. Import a fitness CSV." icon="🏃" />
        )}
      </View>

      {/* Insights */}
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>💡 Top Insights</Text>
          <Link href="/(app)/(tabs)/insights" asChild>
            <TouchableOpacity><Text style={styles.seeAll}>See all</Text></TouchableOpacity>
          </Link>
        </View>
        {insights.length > 0 ? (
          insights.slice(0, 3).map((i) => <InsightCard key={i.id} insight={i} />)
        ) : (
          <EmptyState message="Add data from 2+ sources to unlock insights." icon="🔍" />
        )}
      </View>
    </ScrollView>
  )
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: Colors.background },
  content: { paddingHorizontal: 20, paddingBottom: 32 },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: Colors.background },
  headerSection: { marginBottom: 20 },
  greeting: { fontSize: 22, fontWeight: '700', color: Colors.text },
  date: { fontSize: 13, color: Colors.textSecondary, marginTop: 3 },
  onboarding: {
    backgroundColor: Colors.primaryLight,
    borderRadius: 16,
    padding: 18,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: '#c7d2fe',
  },
  onboardingTitle: { fontSize: 16, fontWeight: '700', color: Colors.primaryDark, marginBottom: 6 },
  onboardingText: { fontSize: 13, color: Colors.primary, lineHeight: 19, marginBottom: 12 },
  onboardingBtn: {
    backgroundColor: Colors.primary,
    borderRadius: 10,
    paddingVertical: 10,
    paddingHorizontal: 16,
    alignSelf: 'flex-start',
  },
  onboardingBtnText: { color: Colors.white, fontWeight: '700', fontSize: 13 },
  statsGrid: { marginBottom: 16 },
  statsRow: { flexDirection: 'row' },
  habitPrompt: {
    backgroundColor: Colors.primary,
    borderRadius: 16,
    padding: 18,
    marginBottom: 20,
  },
  habitPromptTitle: { fontSize: 16, fontWeight: '700', color: Colors.white, marginBottom: 4 },
  habitPromptSub: { fontSize: 13, color: '#c7d2fe' },
  section: {
    backgroundColor: Colors.card,
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  sectionTitle: { fontSize: 15, fontWeight: '700', color: Colors.text },
  seeAll: { fontSize: 13, color: Colors.primary, fontWeight: '600' },
  activityRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: Colors.gray100,
  },
  activityDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: Colors.success, marginRight: 10 },
  activityInfo: { flex: 1 },
  activityType: { fontSize: 14, fontWeight: '600', color: Colors.text },
  activityDate: { fontSize: 12, color: Colors.textMuted },
  activityRight: { alignItems: 'flex-end' },
  activityValue: { fontSize: 13, color: Colors.gray700 },
  activitySub: { fontSize: 11, color: Colors.textMuted },
})
