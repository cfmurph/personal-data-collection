import { useEffect, useState } from 'react'
import {
  View, Text, ScrollView, StyleSheet, TouchableOpacity,
  TextInput, Alert, RefreshControl, ActivityIndicator,
} from 'react-native'
import { format, subDays, parseISO } from 'date-fns'
import { createHabitEntry, updateHabitEntry, getHabitEntries } from '../../../src/lib/apiClient'
import type { HabitEntry } from '../../../src/lib/apiClient'
import MetricRating from '../../../src/components/MetricRating'
import Colors from '../../../src/constants/colors'
import { useSafeAreaInsets } from 'react-native-safe-area-context'

export default function HabitsScreen() {
  const insets = useSafeAreaInsets()
  const today = format(new Date(), 'yyyy-MM-dd')
  const [entries, setEntries] = useState<HabitEntry[]>([])
  const [todayEntry, setTodayEntry] = useState<HabitEntry | null>(null)
  const [form, setForm] = useState<{ mood: number | null; energy: number | null; focus: number | null; notes: string }>({
    mood: null, energy: null, focus: null, notes: '',
  })
  const [saving, setSaving] = useState(false)
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)

  const load = async () => {
    try {
      const start = format(subDays(new Date(), 30), 'yyyy-MM-dd')
      const res = await getHabitEntries({ start_date: start })
      const all = res.data
      setEntries(all)
      const te = all.find((e) => e.date === today) || null
      setTodayEntry(te)
      if (te) setForm({ mood: te.mood, energy: te.energy, focus: te.focus, notes: te.notes || '' })
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }

  useEffect(() => { load() }, [])

  const onRefresh = () => { setRefreshing(true); load() }

  const handleSave = async () => {
    if (!form.mood && !form.energy && !form.focus) {
      Alert.alert('Nothing to save', 'Please rate at least one metric.')
      return
    }
    setSaving(true)
    try {
      const payload = { date: today, mood: form.mood, energy: form.energy, focus: form.focus, notes: form.notes || null }
      if (todayEntry) {
        await updateHabitEntry(today, payload)
      } else {
        await createHabitEntry(payload)
      }
      await load()
      Alert.alert('Saved', todayEntry ? 'Check-in updated!' : "Today's check-in saved!")
    } catch {
      Alert.alert('Error', 'Failed to save. Try again.')
    } finally {
      setSaving(false)
    }
  }

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
      keyboardShouldPersistTaps="handled"
    >
      <View style={styles.headerSection}>
        <Text style={styles.title}>Daily Habits</Text>
        <Text style={styles.subtitle}>Track your mood, energy, and focus</Text>
      </View>

      {/* Check-in card */}
      <View style={styles.card}>
        <View style={styles.cardHeader}>
          <Text style={styles.cardTitle}>Today's Check-in</Text>
          <Text style={styles.cardDate}>{format(new Date(), 'EEE, MMM d')}</Text>
          {todayEntry && (
            <View style={styles.loggedBadge}>
              <Text style={styles.loggedBadgeText}>✓ Logged</Text>
            </View>
          )}
        </View>

        <MetricRating label="😊 Mood" value={form.mood} onChange={(v) => setForm({ ...form, mood: v })} color={Colors.purple} />
        <MetricRating label="⚡ Energy" value={form.energy} onChange={(v) => setForm({ ...form, energy: v })} color={Colors.warning} />
        <MetricRating label="🧠 Focus" value={form.focus} onChange={(v) => setForm({ ...form, focus: v })} color={Colors.primary} />

        <Text style={styles.notesLabel}>Notes (optional)</Text>
        <TextInput
          style={styles.notesInput}
          placeholder="How did the day go?"
          placeholderTextColor={Colors.textMuted}
          value={form.notes}
          onChangeText={(v) => setForm({ ...form, notes: v })}
          multiline
          numberOfLines={3}
          textAlignVertical="top"
        />

        <TouchableOpacity
          style={[styles.saveBtn, saving && { opacity: 0.6 }]}
          onPress={handleSave}
          disabled={saving}
          activeOpacity={0.8}
        >
          <Text style={styles.saveBtnText}>{saving ? 'Saving…' : todayEntry ? 'Update Check-in' : 'Save Check-in'}</Text>
        </TouchableOpacity>
      </View>

      {/* History */}
      {entries.length > 1 && (
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Recent History</Text>
          {entries.slice(0, 14).map((e) => (
            <View key={e.id} style={styles.historyRow}>
              <Text style={styles.historyDate}>{format(parseISO(e.date), 'MMM d, EEE')}</Text>
              <View style={styles.historyScores}>
                {e.mood !== null && <Text style={styles.historyScore}>❤️ {e.mood}</Text>}
                {e.energy !== null && <Text style={styles.historyScore}>⚡ {e.energy}</Text>}
                {e.focus !== null && <Text style={styles.historyScore}>🧠 {e.focus}</Text>}
              </View>
              {e.notes ? <Text style={styles.historyNote} numberOfLines={1}>"{e.notes}"</Text> : null}
            </View>
          ))}
        </View>
      )}
    </ScrollView>
  )
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: Colors.background },
  content: { paddingHorizontal: 20, paddingBottom: 32 },
  headerSection: { marginBottom: 18 },
  title: { fontSize: 24, fontWeight: '700', color: Colors.text },
  subtitle: { fontSize: 13, color: Colors.textSecondary, marginTop: 3 },
  card: {
    backgroundColor: Colors.card,
    borderRadius: 20,
    padding: 18,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  cardHeader: { flexDirection: 'row', alignItems: 'center', flexWrap: 'wrap', gap: 8, marginBottom: 18 },
  cardTitle: { fontSize: 16, fontWeight: '700', color: Colors.text, flex: 1 },
  cardDate: { fontSize: 13, color: Colors.textMuted },
  loggedBadge: { backgroundColor: Colors.successLight, paddingHorizontal: 8, paddingVertical: 3, borderRadius: 100 },
  loggedBadgeText: { fontSize: 11, fontWeight: '700', color: Colors.success },
  notesLabel: { fontSize: 13, fontWeight: '600', color: Colors.gray700, marginBottom: 8 },
  notesInput: {
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: 10,
    padding: 12,
    fontSize: 14,
    color: Colors.text,
    backgroundColor: Colors.gray50,
    minHeight: 80,
    marginBottom: 16,
  },
  saveBtn: {
    backgroundColor: Colors.primary,
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
  },
  saveBtnText: { color: Colors.white, fontWeight: '700', fontSize: 15 },
  historyRow: {
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: Colors.gray100,
  },
  historyDate: { fontSize: 13, color: Colors.gray500, marginBottom: 4 },
  historyScores: { flexDirection: 'row', gap: 12 },
  historyScore: { fontSize: 13, color: Colors.text },
  historyNote: { fontSize: 12, color: Colors.textMuted, marginTop: 3, fontStyle: 'italic' },
})
