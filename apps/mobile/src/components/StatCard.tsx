import { View, Text, StyleSheet } from 'react-native'
import Colors from '../constants/colors'

interface StatCardProps {
  label: string
  value: string | number
  sub?: string
  color?: keyof typeof colorMap
}

const colorMap = {
  indigo: { bg: Colors.primaryLight, text: Colors.primary },
  green: { bg: Colors.successLight, text: Colors.success },
  orange: { bg: Colors.orangeLight, text: Colors.orange },
  red: { bg: Colors.dangerLight, text: Colors.danger },
  purple: { bg: Colors.purpleLight, text: Colors.purple },
  blue: { bg: '#eff6ff', text: '#3b82f6' },
}

export default function StatCard({ label, value, sub, color = 'indigo' }: StatCardProps) {
  const c = colorMap[color]
  return (
    <View style={styles.card}>
      <View style={[styles.dot, { backgroundColor: c.bg }]}>
        <View style={[styles.dotInner, { backgroundColor: c.text }]} />
      </View>
      <Text style={styles.label}>{label}</Text>
      <Text style={[styles.value, { color: c.text }]}>{value}</Text>
      {sub ? <Text style={styles.sub}>{sub}</Text> : null}
    </View>
  )
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: Colors.card,
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: Colors.border,
    flex: 1,
  },
  dot: {
    width: 32,
    height: 32,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 10,
  },
  dotInner: {
    width: 12,
    height: 12,
    borderRadius: 6,
  },
  label: {
    fontSize: 12,
    color: Colors.textSecondary,
    fontWeight: '500',
    marginBottom: 4,
  },
  value: {
    fontSize: 22,
    fontWeight: '700',
    color: Colors.text,
  },
  sub: {
    fontSize: 11,
    color: Colors.textMuted,
    marginTop: 3,
  },
})
