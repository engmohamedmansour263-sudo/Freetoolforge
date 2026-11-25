'use client';
import { useState, type FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import type { Locale } from '@/lib/i18n';

export default function AdminLoginForm({locale='en'}:{locale?:Locale}) {
  const labels = ({en:{email:'Email address',password:'Password',busy:'Checking…',login:'Sign in',error:'Unable to sign in'},ar:{email:'البريد الإلكتروني',password:'كلمة المرور',busy:'جارٍ التحقق…',login:'تسجيل الدخول',error:'تعذر تسجيل الدخول'},hi:{email:'ईमेल पता',password:'पासवर्ड',busy:'जाँच हो रही है…',login:'साइन इन करें',error:'साइन इन नहीं हो सका'},bn:{email:'ইমেইল ঠিকানা',password:'পাসওয়ার্ড',busy:'যাচাই হচ্ছে…',login:'সাইন ইন',error:'সাইন ইন করা যায়নি'}} as const)[locale];
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); setBusy(true); setError('');
    try {
      const response = await fetch('/api/auth/login', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ email, password }) });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || labels.error);
      router.replace('/admin'); router.refresh();
    } catch (err) { setError(err instanceof Error ? err.message : labels.error); }
    finally { setBusy(false); }
  }
  return <form onSubmit={submit} className="admin-login-form">
    <label>{labels.email}<input className="field" type="email" autoComplete="username" required value={email} onChange={e=>setEmail(e.target.value)} /></label>
    <label>{labels.password}<input className="field" type="password" autoComplete="current-password" required value={password} onChange={e=>setPassword(e.target.value)} /></label>
    {error && <p className="admin-error" role="alert">{error}</p>}
    <button className="btn" disabled={busy}>{busy ? labels.busy : labels.login}</button>
  </form>;
}
