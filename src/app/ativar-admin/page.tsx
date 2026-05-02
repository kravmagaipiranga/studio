'use client';

import { useEffect, useState } from 'react';
import { getAuth, onAuthStateChanged, type User } from 'firebase/auth';
import { getApps, initializeApp } from 'firebase/app';
import { firebaseConfig } from '@/firebase/config';

export default function AtivarAdminPage() {
  const [user, setUser] = useState<User | null | undefined>(undefined);
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [message, setMessage] = useState('');

  useEffect(() => {
    const app = getApps().length > 0 ? getApps()[0] : initializeApp(firebaseConfig);
    const auth = getAuth(app);
    const unsub = onAuthStateChanged(auth, u => setUser(u));
    return () => unsub();
  }, []);

  async function activate() {
    if (!user) return;
    setStatus('loading');
    setMessage('');
    try {
      const token = await user.getIdToken();
      const res = await fetch('/api/admin/activate', {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json() as { success?: boolean; message?: string; error?: string };
      if (data.success) {
        setStatus('success');
        setMessage(data.message ?? 'Permissão ativada com sucesso!');
      } else {
        setStatus('error');
        setMessage(data.error ?? 'Erro desconhecido.');
      }
    } catch {
      setStatus('error');
      setMessage('Falha na conexão. Tente novamente.');
    }
  }

  return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#f8fafc', padding: '1rem' }}>
      <div style={{ background: '#fff', borderRadius: '1rem', padding: '2rem', maxWidth: '420px', width: '100%', boxShadow: '0 4px 24px rgba(0,0,0,0.08)', fontFamily: 'system-ui, sans-serif' }}>

        <div style={{ marginBottom: '1.5rem' }}>
          <h1 style={{ fontSize: '1.25rem', fontWeight: 700, color: '#1e293b', margin: 0 }}>
            Ativar Permissão de Administrador
          </h1>
          <p style={{ fontSize: '0.875rem', color: '#64748b', marginTop: '0.5rem' }}>
            As regras do Firestore foram atualizadas e agora exigem um <em>custom claim</em> de administrador.
            Use este painel para ativá-lo permanentemente.
          </p>
        </div>

        {user === undefined && (
          <p style={{ color: '#64748b', fontSize: '0.875rem' }}>Verificando sessão…</p>
        )}

        {user === null && (
          <div style={{ background: '#fef2f2', border: '1px solid #fecaca', borderRadius: '0.5rem', padding: '1rem' }}>
            <p style={{ color: '#dc2626', fontSize: '0.875rem', margin: 0 }}>
              Você precisa estar logado como administrador para continuar.
            </p>
            <a href="/login" style={{ display: 'inline-block', marginTop: '0.75rem', color: '#2563eb', fontSize: '0.875rem' }}>
              → Ir para o login
            </a>
          </div>
        )}

        {user && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <div style={{ background: '#f1f5f9', borderRadius: '0.5rem', padding: '0.75rem 1rem' }}>
              <p style={{ margin: 0, fontSize: '0.75rem', color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Usuário logado</p>
              <p style={{ margin: '0.25rem 0 0', fontWeight: 600, fontSize: '0.875rem', color: '#1e293b' }}>{user.email}</p>
              <p style={{ margin: '0.125rem 0 0', fontSize: '0.75rem', color: '#94a3b8' }}>UID: {user.uid}</p>
            </div>

            {status === 'success' ? (
              <div style={{ background: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: '0.5rem', padding: '1rem' }}>
                <p style={{ color: '#16a34a', fontWeight: 600, fontSize: '0.875rem', margin: 0 }}>✓ {message}</p>
                <p style={{ color: '#166534', fontSize: '0.8rem', marginTop: '0.5rem' }}>
                  <strong>Próximo passo:</strong> Faça logout e login novamente para o claim entrar em vigor.
                </p>
                <a href="/login" style={{ display: 'inline-block', marginTop: '0.75rem', background: '#16a34a', color: '#fff', padding: '0.5rem 1rem', borderRadius: '0.375rem', fontSize: '0.875rem', textDecoration: 'none' }}>
                  Ir para login →
                </a>
              </div>
            ) : status === 'error' ? (
              <div style={{ background: '#fef2f2', border: '1px solid #fecaca', borderRadius: '0.5rem', padding: '1rem' }}>
                <p style={{ color: '#dc2626', fontSize: '0.875rem', margin: 0 }}>✗ {message}</p>
                <button onClick={activate} style={{ marginTop: '0.75rem', background: '#dc2626', color: '#fff', border: 'none', padding: '0.5rem 1rem', borderRadius: '0.375rem', cursor: 'pointer', fontSize: '0.875rem' }}>
                  Tentar novamente
                </button>
              </div>
            ) : (
              <button
                onClick={activate}
                disabled={status === 'loading'}
                style={{
                  background: status === 'loading' ? '#94a3b8' : '#1d4ed8',
                  color: '#fff',
                  border: 'none',
                  padding: '0.75rem 1.5rem',
                  borderRadius: '0.5rem',
                  cursor: status === 'loading' ? 'not-allowed' : 'pointer',
                  fontWeight: 600,
                  fontSize: '0.9375rem',
                  width: '100%',
                }}
              >
                {status === 'loading' ? 'Ativando… aguarde' : '🔑 Ativar permissão de admin'}
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
