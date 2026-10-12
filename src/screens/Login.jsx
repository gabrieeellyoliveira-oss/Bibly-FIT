import { useEffect, useState } from 'react'
import Icon from '../components/Icon'
import Icon3D from '../components/Icon3D'
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
  const [invalid, setInvalid] = useState(null) // 'name' | 'email' | 'password'

  useEffect(() => {
    if (recovering) setMode('newPassword')
  }, [recovering])

  const switchTo = (m) => {
    setMode(m)
    setInvalid(null)
    setError('')
    setNotice('')
  }

  const submit = async (e) => {
    e.preventDefault()
    setError('')
    setNotice('')
    setInvalid(null)
    const fail = (field, msg) => {
      setInvalid(field)
      setError(msg)
    }
    if (mode === 'signup' && !name.trim()) return fail('name', 'Conte como você quer ser chamada.')
    if (mode !== 'newPassword' && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim()))
      return fail('email', email.trim() ? 'Esse e-mail não parece válido.' : 'Digite seu e-mail.')
    if (mode !== 'reset' && password.length < 6)
      return fail('password', password ? 'A senha precisa ter pelo menos 6 caracteres.' : 'Digite sua senha.')
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
        toast('Senha atualizada')
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
        <div className="login-icons" aria-hidden="true">
          <Icon3D name="dumbbell" size={44} />
          <Icon3D name="flame" size={56} />
          <Icon3D name="trophy" size={44} />
        </div>
        <div className="brand">
          bibly<span className="brand-dot">.</span>
        </div>
        <p className="login-welcome">Seu espaço, sua evolução ♡</p>
      </div>

      <form className="card login-card form" onSubmit={submit} noValidate>
        <div className="login-head">
          <h1>{title}</h1>
          <p>{subtitle}</p>
        </div>

        {mode === 'signup' && (
          <label className="field">
            Como quer ser chamada?
            <input
              className="input"
              aria-invalid={invalid === 'name'}
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Seu nome"
              autoComplete="given-name"
            />
          </label>
        )}

        {needsEmail && (
          <label className="field">
            E-mail
            <input
              className="input"
              type="email"
              aria-invalid={invalid === 'email'}
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
          <label className="field">
            {mode === 'newPassword' ? 'Nova senha' : 'Senha'}
            <span className="input-group">
              <input
                type={showPassword ? 'text' : 'password'}
                aria-invalid={invalid === 'password'}
                autoComplete={mode === 'login' ? 'current-password' : 'new-password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Mínimo de 6 caracteres"
                minLength={6}
                required
              />
              <button
                type="button"
                className="input-action"
                onClick={() => setShowPassword(!showPassword)}
                aria-label={showPassword ? 'Ocultar senha' : 'Mostrar senha'}
              >
                {showPassword ? 'Ocultar' : 'Mostrar'}
              </button>
            </span>
          </label>
        )}

        {mode === 'login' && (
          <button type="button" className="link login-forgot" onClick={() => switchTo('reset')}>
            Esqueci minha senha
          </button>
        )}

        {error && (
          <p className="alert alert-error" role="alert">
            {error}
          </p>
        )}
        {notice && (
          <p className="alert alert-info" role="status">
            {notice}
          </p>
        )}

        <button className="btn btn-primary btn-lg btn-block btn-cta" type="submit" disabled={busy}>
          {busy ? (
            <>
              <span className="spinner" style={{ width: 20, height: 20, borderWidth: 2.5, borderColor: 'rgba(255,255,255,.4)', borderTopColor: '#fff' }} />
              {{ login: 'Entrando…', signup: 'Criando conta…', reset: 'Enviando link…', newPassword: 'Salvando…' }[mode]}
            </>
          ) : (
            { login: 'Entrar', signup: 'Criar conta', reset: 'Enviar link', newPassword: 'Salvar nova senha' }[mode]
          )}
        </button>
      </form>

      {mode === 'login' && (
        <p className="login-switch">
          Ainda não tem conta?{' '}
          <button className="link" onClick={() => switchTo('signup')}>
            Criar conta
          </button>
        </p>
      )}
      {(mode === 'signup' || mode === 'reset') && (
        <p className="login-switch">
          Já tem conta?{' '}
          <button className="link" onClick={() => switchTo('login')}>
            Entrar
          </button>
        </p>
      )}

      <p className="private-note">
        <Icon name="lock" size={13} /> Seus dados e fotos são privados
      </p>
    </div>
  )
}
