import { View, Text, StyleSheet } from 'react-native'
import Colors from '../constants/colors'

export default function EmptyState({ message, icon = '📭' }: { message: string; icon?: string }) {
  return (
    <View style={styles.container}>
      <Text style={styles.icon}>{icon}</Text>
      <Text style={styles.message}>{message}</Text>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    paddingVertical: 40,
    alignItems: 'center',
  },
  icon: {
    fontSize: 36,
    marginBottom: 10,
  },
  message: {
    fontSize: 14,
    color: Colors.textMuted,
    textAlign: 'center',
    maxWidth: 260,
    lineHeight: 20,
  },
})
