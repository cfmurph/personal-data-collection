import { Redirect } from 'expo-router'
import { useAuth } from '../src/context/AuthContext'
import { View, ActivityIndicator } from 'react-native'
import Colors from '../src/constants/colors'

export default function Index() {
  const { user, loading } = useAuth()

  if (loading) {
    return (
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: Colors.background }}>
        <ActivityIndicator size="large" color={Colors.primary} />
      </View>
    )
  }

  return <Redirect href={user ? '/(app)/(tabs)/dashboard' : '/(auth)/login'} />
}
