import { useState } from 'react'
import {
  View, Text, TextInput, TouchableOpacity,
  StyleSheet, ScrollView, Alert, KeyboardAvoidingView, Platform,
} from 'react-native'
import { Link, router } from 'expo-router'
import { login } from '../../src/lib/apiClient'
import { useAuth } from '../../src/context/AuthContext'
import Colors from '../../src/constants/colors'

export default function LoginScreen() {
  const { setAuth } = useAuth()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)

  const handleLogin = async () => {
    if (!email || !password) {
      Alert.alert('Missing fields', 'Please enter your email and password.')
      return
    }
    setLoading(true)
    try {
      const res = await login(email.trim().toLowerCase(), password)
      await setAuth(res.data.access_token, res.data.user)
      router.replace('/(app)/(tabs)/dashboard')
    } catch {
      Alert.alert('Login failed', 'Incorrect email or password.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">
        <View style={styles.logoRow}>
          <View style={styles.logoBadge}>
            <Text style={styles.logoText}>PD</Text>
          </View>
          <View>
            <Text style={styles.appName}>Personal Data Hub</Text>
            <Text style={styles.tagline}>Sign in to your account</Text>
          </View>
        </View>

        <View style={styles.card}>
          <Text style={styles.fieldLabel}>Email</Text>
          <TextInput
            style={styles.input}
            placeholder="you@example.com"
            placeholderTextColor={Colors.textMuted}
            value={email}
            onChangeText={setEmail}
            autoCapitalize="none"
            keyboardType="email-address"
            autoComplete="email"
          />

          <Text style={styles.fieldLabel}>Password</Text>
          <TextInput
            style={styles.input}
            placeholder="••••••••"
            placeholderTextColor={Colors.textMuted}
            value={password}
            onChangeText={setPassword}
            secureTextEntry
            autoComplete="password"
          />

          <TouchableOpacity
            style={[styles.btn, loading && styles.btnDisabled]}
            onPress={handleLogin}
            disabled={loading}
            activeOpacity={0.8}
          >
            <Text style={styles.btnText}>{loading ? 'Signing in…' : 'Sign in'}</Text>
          </TouchableOpacity>
        </View>

        <Text style={styles.footer}>
          Don't have an account?{' '}
          <Link href="/(auth)/register" style={styles.link}>Create one</Link>
        </Text>
      </ScrollView>
    </KeyboardAvoidingView>
  )
}

const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
    backgroundColor: Colors.background,
    padding: 24,
    justifyContent: 'center',
  },
  logoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    marginBottom: 32,
  },
  logoBadge: {
    width: 52,
    height: 52,
    borderRadius: 14,
    backgroundColor: Colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  logoText: {
    color: Colors.white,
    fontWeight: '800',
    fontSize: 18,
  },
  appName: {
    fontSize: 20,
    fontWeight: '700',
    color: Colors.text,
  },
  tagline: {
    fontSize: 13,
    color: Colors.textSecondary,
    marginTop: 2,
  },
  card: {
    backgroundColor: Colors.card,
    borderRadius: 20,
    padding: 22,
    borderWidth: 1,
    borderColor: Colors.border,
    marginBottom: 20,
  },
  fieldLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: Colors.gray700,
    marginBottom: 6,
    marginTop: 4,
  },
  input: {
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 11,
    fontSize: 15,
    color: Colors.text,
    backgroundColor: Colors.gray50,
    marginBottom: 14,
  },
  btn: {
    backgroundColor: Colors.primary,
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
    marginTop: 4,
  },
  btnDisabled: { opacity: 0.6 },
  btnText: {
    color: Colors.white,
    fontWeight: '700',
    fontSize: 15,
  },
  footer: {
    textAlign: 'center',
    fontSize: 14,
    color: Colors.textSecondary,
  },
  link: {
    color: Colors.primary,
    fontWeight: '600',
  },
})
