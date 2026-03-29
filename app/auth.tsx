import { useState } from 'react'
import { Alert, KeyboardAvoidingView, Platform, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native'
import i18n from '../lib/i18n'
import { supabase } from '../lib/supabase'
import { colors, font, radii, spacing } from '../lib/theme'

export default function Auth() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [isLogin, setIsLogin] = useState(true)
  const [loading, setLoading] = useState(false)

  async function handleAuth() {
    setLoading(true)
    if (isLogin) {
      const { error } = await supabase.auth.signInWithPassword({ email, password })
      if (error) Alert.alert(i18n.t('auth.error'), error.message)
    } else {
      const { error } = await supabase.auth.signUp({ email, password })
      if (error) Alert.alert(i18n.t('auth.error'), error.message)
      else Alert.alert(i18n.t('auth.check_email'))
    }
    setLoading(false)
  }

  async function handleForgotPassword() {
    if (!email.trim()) {
      Alert.alert(i18n.t('auth.insert_email'), i18n.t('auth.insert_email_body'))
      return
    }
    const { error } = await supabase.auth.resetPasswordForEmail(email.trim())
    if (error) Alert.alert(i18n.t('auth.error'), error.message)
    else Alert.alert(i18n.t('auth.reset_sent'), i18n.t('auth.reset_sent_body'))
  }

  return (
    <KeyboardAvoidingView style={s.container} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
      <View style={s.inner}>
        <Text style={s.logo}>spotly</Text>
        <Text style={s.subtitle}>
          {isLogin ? i18n.t('auth.welcome_back') : i18n.t('auth.create_account')}
        </Text>

        <TextInput style={s.input} placeholder={i18n.t('auth.email')}
          placeholderTextColor={colors.textPlaceholder}
          value={email} onChangeText={setEmail} autoCapitalize="none" keyboardType="email-address" />
        <TextInput style={s.input} placeholder={i18n.t('auth.password')}
          placeholderTextColor={colors.textPlaceholder}
          value={password} onChangeText={setPassword} secureTextEntry />

        <TouchableOpacity style={s.button} onPress={handleAuth} disabled={loading}>
          <Text style={s.buttonText}>
            {loading ? i18n.t('auth.loading') : isLogin ? i18n.t('auth.login') : i18n.t('auth.register')}
          </Text>
        </TouchableOpacity>

        {isLogin && (
          <TouchableOpacity onPress={handleForgotPassword} style={{ marginBottom: spacing.md }}>
            <Text style={s.forgotText}>{i18n.t('auth.forgot_password')}</Text>
          </TouchableOpacity>
        )}

        <TouchableOpacity onPress={() => setIsLogin(!isLogin)}>
          <Text style={s.switchText}>
            {isLogin ? i18n.t('auth.no_account') : i18n.t('auth.have_account')}
          </Text>
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  )
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg },
  inner: { flex: 1, justifyContent: 'center', paddingHorizontal: spacing.xl },
  logo: { color: colors.white, fontSize: 48, fontWeight: '700', marginBottom: spacing.sm, letterSpacing: -1 },
  subtitle: { color: colors.textMuted, ...font.title, marginBottom: spacing.xxl },
  input: {
    backgroundColor: colors.input, borderRadius: radii.md, padding: spacing.md,
    ...font.body, color: colors.white, marginBottom: spacing.sm,
    borderWidth: 1, borderColor: colors.inputBorder,
  },
  button: {
    backgroundColor: colors.primary, borderRadius: radii.md,
    padding: spacing.md, alignItems: 'center', marginTop: spacing.sm, marginBottom: spacing.md,
  },
  buttonText: { color: colors.white, ...font.button },
  forgotText: { color: colors.textMuted, ...font.label, textAlign: 'center' },
  switchText: { color: colors.primary, ...font.label, textAlign: 'center' },
})
