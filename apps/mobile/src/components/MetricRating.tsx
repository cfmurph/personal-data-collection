import { View, Text, TouchableOpacity, StyleSheet } from 'react-native'
import Colors from '../constants/colors'

const EMOJI = ['😞', '😕', '😐', '😊', '😄']

interface MetricRatingProps {
  label: string
  value: number | null
  onChange: (v: number) => void
  color?: string
}

export default function MetricRating({ label, value, onChange, color = Colors.primary }: MetricRatingProps) {
  return (
    <View style={styles.container}>
      <View style={styles.labelRow}>
        <Text style={styles.label}>{label}</Text>
        {value !== null && (
          <Text style={[styles.score, { color }]}>{value}/5</Text>
        )}
      </View>
      <View style={styles.row}>
        {[1, 2, 3, 4, 5].map((n) => (
          <TouchableOpacity
            key={n}
            onPress={() => onChange(n)}
            style={[
              styles.btn,
              value === n && { borderColor: color, backgroundColor: `${color}18` },
            ]}
            activeOpacity={0.7}
          >
            <Text style={styles.emoji}>{EMOJI[n - 1]}</Text>
          </TouchableOpacity>
        ))}
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  container: { marginBottom: 18 },
  labelRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.text,
  },
  score: {
    fontSize: 13,
    fontWeight: '600',
  },
  row: {
    flexDirection: 'row',
    gap: 8,
  },
  btn: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: Colors.border,
    alignItems: 'center',
    backgroundColor: Colors.gray50,
  },
  emoji: { fontSize: 20 },
})
