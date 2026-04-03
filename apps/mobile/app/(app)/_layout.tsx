import { Stack } from 'expo-router'
import { useAuth } from '../../src/context/AuthContext'
import { Redirect } from 'expo-router'
import { View, ActivityIndicator } from 'react-native'
import Colors from '../../src/constants/colors'

export default function AppLayout() {
  const { user, loading } = useAuth()

  if (loading) {
    return (
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
        <ActivityIndicator size="large" color={Colors.primary} />
      </View>
    )
  }

  if (!user) return <Redirect href="/(auth)/login" />

  return <Stack screenOptions={{ headerShown: false }} />
}
