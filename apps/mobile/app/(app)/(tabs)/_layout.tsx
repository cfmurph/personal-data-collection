import { Tabs } from 'expo-router'
import { Ionicons } from '@expo/vector-icons'
import Colors from '../../../src/constants/colors'

type IoniconsName = React.ComponentProps<typeof Ionicons>['name']

const tabs: Array<{ name: string; title: string; icon: IoniconsName; iconActive: IoniconsName }> = [
  { name: 'dashboard', title: 'Dashboard', icon: 'grid-outline', iconActive: 'grid' },
  { name: 'finance', title: 'Finance', icon: 'trending-up-outline', iconActive: 'trending-up' },
  { name: 'fitness', title: 'Fitness', icon: 'barbell-outline', iconActive: 'barbell' },
  { name: 'habits', title: 'Habits', icon: 'heart-outline', iconActive: 'heart' },
  { name: 'insights', title: 'Insights', icon: 'bulb-outline', iconActive: 'bulb' },
]

export default function TabsLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: Colors.primary,
        tabBarInactiveTintColor: Colors.gray400,
        tabBarStyle: {
          backgroundColor: Colors.card,
          borderTopColor: Colors.border,
          paddingBottom: 4,
          height: 60,
        },
        tabBarLabelStyle: {
          fontSize: 11,
          fontWeight: '600',
        },
      }}
    >
      {tabs.map(({ name, title, icon, iconActive }) => (
        <Tabs.Screen
          key={name}
          name={name}
          options={{
            title,
            tabBarIcon: ({ focused, color, size }) => (
              <Ionicons name={focused ? iconActive : icon} size={size} color={color} />
            ),
          }}
        />
      ))}
      <Tabs.Screen name="data" options={{ href: null }} />
    </Tabs>
  )
}
