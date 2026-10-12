import { useEffect, useState } from 'react'
import Icon from '../components/Icon'
import { toast } from '../components/ui'
import { supabase } from '../lib/supabase'
import { authMessage, useAuth } from '../lib/auth'

const TITLES = {
  login: ['Que bom te ver', 'Entre para continuar sua evolução.'],
  signup: ['Criar sua conta', 'Seus treinos e fotos salvos com segurança.'],
  reset: ['Esqueci a senha', 'Enviamos um link para você criar uma nova.'],
  newPassword: ['Nova senha', 'Escolha uma senha nova para entrar.'],
}

export default function Login() {
  const { recovering, doneRecovering } = useAuth()
  const [mode, setMode] = useState(recovering ? 'newPassword' : 'login')
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const [notice, setNotice] = useState('')

  useEffect(() => {
    if (recovering) setMode('newPassword')
  }, [recovering])

  const switchTo = (m) => {
    setMode(m)
    setError('')
    setNotice('')
  }

  const submit = async (e) => {
    e.preventDefault()
    setError('')
    setNotice('')
    setBusy(true)
    try {
      if (mode === 'login') {
        const { error } = await supabase.auth.signInWithPassword({ email: email.trim(), password })
        if (error) throw error
      } else if (mode === 'signup') {
        const { data, error } = await supabase.auth.signUp({
          email: email.trim(),
          password,
          options: { data: { name: name.trim() }, emailRedirectTo: location.origin },
        })
        if (error) throw error
        if (!data.session) {
          setNotice('Conta criada! Enviamos um e-mail de confirmação. Toque no link e depois entre aqui.')
          setMode('login')
        }
      } else if (mode === 'reset') {
        const { error } = await supabase.auth.resetPasswordForEmail(email.trim(), { redirectTo: location.origin })
        if (error) throw error
        setNotice('Pronto! Abra o e-mail que enviamos e toque no link para criar uma nova senha.')
      } else if (mode === 'newPassword') {
        const { error } = await supabase.auth.updateUser({ password })
        if (error) throw error
        toast('Senha atualizada ♥')
        doneRecovering()
      }
    } catch (err) {
      setError(authMessage(err))
    } finally {
      setBusy(false)
    }
  }

  const [title, subtitle] = TITLES[mode]
  const needsEmail = mode !== 'newPassword'
  const needsPassword = mode !== 'reset'

  return (
    <div className="login">
      <div className="login-brand">
        <div className="brand">bibly</div>
        <div className="brand-tag">YOUR PERSONAL WELLNESS SPACE</div>
      </div>

      <form className="card login-card form" onSubmit={submit}>
        <div className="login-head">
          <h1 className="serif page-title">{title}</h1>
          <p className="greet-sub">{subtitle}</p>
        </div>

        {mode === 'signup' && (
          <label>
            Como quer ser chamada?
            <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Seu nome" autoComplete="given-name" />
          </label>
        )}

        {needsEmail && (
          <label>
            E-mail
            <input
              type="email"
              inputMode="email"
              autoComplete="email"
              autoCapitalize="none"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="voce@email.com"
              required
            />
          </label>
        )}

        {needsPassword && (
          <label>
            {mode === 'newPassword' ? 'Nova senha' : 'Senha'}
            <span className="password-field">
              <input
                type={showPassword ? 'text' : 'password'}
                autoComplete={mode === 'login' ? 'current-password' : 'new-password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Mínimo de 6 caracteres"
                minLength={6}
                required
              />
              <button type="button" className="password-toggle" onClick={() => setShowPassword(!showPassword)}>
                {showPassword ? 'Ocultar' : 'Mostrar'}
              </button>
            </span>
          </label>
        )}

        {mode === 'login' && (
          <button type="button" className="link-soft login-forgot" onClick={() => switchTo('reset')}>
            Esqueci minha senha
          </button>
        )}

        {error && <p className="login-error">{error}</p>}
        {notice && <p className="login-notice">{notice}</p>}

        <button className="btn-primary" type="submit" disabled={busy}>
          {busy
            ? 'Aguarde…'
            : { login: 'Entrar', signup: 'Criar conta', reset: 'Enviar link', newPassword: 'Salvar nova senha' }[mode]}
          {!busy && <Icon name="arrowRight" size={18} />}
        </button>
      </form>

      {mode === 'login' && (
        <p className="login-switch">
          Ainda não tem conta?{' '}
          <button className="link-soft" onClick={() => switchTo('signup')}>
            Criar conta
          </button>
        </p>
      )}
      {(mode === 'signup' || mode === 'reset') && (
        <p className="login-switch">
          Já tem conta?{' '}
          <button className="link-soft" onClick={() => switchTo('login')}>
            Entrar
          </button>
        </p>
      )}

      <p className="private-note">
        <Icon name="lock" size={14} /> Seus dados e fotos são privados
      </p>
    </div>
  )
}
