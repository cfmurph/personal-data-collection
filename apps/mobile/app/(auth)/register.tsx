import { useState } from 'react'
import {
  View, Text, TextInput, TouchableOpacity,
  StyleSheet, ScrollView, Alert, KeyboardAvoidingView, Platform,
} from 'react-native'
import { Link, router } from 'expo-router'
import { register, login } from '../../src/lib/apiClient'
import { useAuth } from '../../src/context/AuthContext'
import Colors from '../../src/constants/colors'

export default function RegisterScreen() {
  const { setAuth } = useAuth()
  const [form, setForm] = useState({ email: '', username: '', password: '', confirm: '' })
  const [loading, setLoading] = useState(false)

  const handleRegister = async () => {
    if (!form.email || !form.username || !form.password) {
      Alert.alert('Missing fields', 'Please fill in all fields.')
      return
    }
    if (form.password.length < 6) {
      Alert.alert('Weak password', 'Password must be at least 6 characters.')
      return
    }
    if (form.password !== form.confirm) {
      Alert.alert('Password mismatch', 'Passwords do not match.')
      return
    }
    setLoading(true)
    try {
      await register({ email: form.email.trim().toLowerCase(), username: form.username.trim(), password: form.password })
      const res = await login(form.email.trim().toLowerCase(), form.password)
      await setAuth(res.data.access_token, res.data.user)
      router.replace('/(app)/(tabs)/dashboard')
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { detail?: string } } })?.response?.data?.detail || 'Registration failed.'
      Alert.alert('Error', msg)
    } finally {
      setLoading(false)
    }
  }

  const f = (key: keyof typeof form) => (v: string) => setForm({ ...form, [key]: v })

  return (
    <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">
        <View style={styles.logoRow}>
          <View style={styles.logoBadge}>
            <Text style={styles.logoText}>PD</Text>
          </View>
          <View>
            <Text style={styles.appName}>Personal Data Hub</Text>
            <Text style={styles.tagline}>Create your account</Text>
          </View>
        </View>

        <View style={styles.card}>
          {[
            { label: 'Email', key: 'email', placeholder: 'you@example.com', keyboard: 'email-address', cap: 'none', secure: false },
            { label: 'Username', key: 'username', placeholder: 'yourname', keyboard: 'default', cap: 'none', secure: false },
            { label: 'Password', key: 'password', placeholder: 'At least 6 characters', keyboard: 'default', cap: 'none', secure: true },
            { label: 'Confirm Password', key: 'confirm', placeholder: '••••••••', keyboard: 'default', cap: 'none', secure: true },
          ].map(({ label, key, placeholder, keyboard, cap, secure }) => (
            <View key={key}>
              <Text style={styles.fieldLabel}>{label}</Text>
              <TextInput
                style={styles.input}
                placeholder={placeholder}
                placeholderTextColor={Colors.textMuted}
                value={form[key as keyof typeof form]}
                onChangeText={f(key as keyof typeof form)}
                autoCapitalize={cap as 'none'}
                keyboardType={keyboard as 'default'}
                secureTextEntry={secure}
              />
            </View>
          ))}

          <TouchableOpacity
            style={[styles.btn, loading && styles.btnDisabled]}
            onPress={handleRegister}
            disabled={loading}
            activeOpacity={0.8}
          >
            <Text style={styles.btnText}>{loading ? 'Creating account…' : 'Create account'}</Text>
          </TouchableOpacity>
        </View>

        <Text style={styles.footer}>
          Already have an account?{' '}
          <Link href="/(auth)/login" style={styles.link}>Sign in</Link>
        </Text>
      </ScrollView>
    </KeyboardAvoidingView>
  )
}

const styles = StyleSheet.create({
  container: { flexGrow: 1, backgroundColor: Colors.background, padding: 24, justifyContent: 'center' },
  logoRow: { flexDirection: 'row', alignItems: 'center', gap: 14, marginBottom: 28 },
  logoBadge: { width: 52, height: 52, borderRadius: 14, backgroundColor: Colors.primary, alignItems: 'center', justifyContent: 'center' },
  logoText: { color: Colors.white, fontWeight: '800', fontSize: 18 },
  appName: { fontSize: 20, fontWeight: '700', color: Colors.text },
  tagline: { fontSize: 13, color: Colors.textSecondary, marginTop: 2 },
  card: { backgroundColor: Colors.card, borderRadius: 20, padding: 22, borderWidth: 1, borderColor: Colors.border, marginBottom: 20 },
  fieldLabel: { fontSize: 13, fontWeight: '600', color: Colors.gray700, marginBottom: 6, marginTop: 4 },
  input: { borderWidth: 1, borderColor: Colors.border, borderRadius: 10, paddingHorizontal: 14, paddingVertical: 11, fontSize: 15, color: Colors.text, backgroundColor: Colors.gray50, marginBottom: 14 },
  btn: { backgroundColor: Colors.primary, borderRadius: 12, paddingVertical: 14, alignItems: 'center', marginTop: 4 },
  btnDisabled: { opacity: 0.6 },
  btnText: { color: Colors.white, fontWeight: '700', fontSize: 15 },
  footer: { textAlign: 'center', fontSize: 14, color: Colors.textSecondary },
  link: { color: Colors.primary, fontWeight: '600' },
})
