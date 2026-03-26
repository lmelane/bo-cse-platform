'use client';

import { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Loader2 } from 'lucide-react';

export default function LoginPage() {
  const { login } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await login(email, password);
    } catch (err) {
      setError((err as Error).message || 'Identifiants incorrects');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-neutral-50 flex items-center justify-center px-4">
      <div className="w-full max-w-sm">
        {/* Logo */}
        <div className="text-center mb-8">
          <h1 className="text-lg font-semibold text-neutral-900 tracking-tight">CSE</h1>
          <p className="text-[10px] uppercase tracking-[0.25em] text-neutral-400 mt-1">Administration</p>
        </div>

        {/* Form card */}
        <div className="bg-white rounded-lg border border-neutral-200 p-6">
          <h2 className="text-sm font-semibold text-neutral-900 mb-4">Connexion</h2>

          <form onSubmit={handleSubmit} className="space-y-3">
            <div>
              <label htmlFor="email" className="block text-xs text-neutral-500 mb-1">Email</label>
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="admin@cse.com"
                required
                autoFocus
                className="w-full h-9 px-3 border border-neutral-200 rounded-md text-sm bg-white focus:outline-none focus:border-neutral-400 placeholder:text-neutral-300"
              />
            </div>

            <div>
              <label htmlFor="password" className="block text-xs text-neutral-500 mb-1">Mot de passe</label>
              <input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                required
                className="w-full h-9 px-3 border border-neutral-200 rounded-md text-sm bg-white focus:outline-none focus:border-neutral-400 placeholder:text-neutral-300"
              />
            </div>

            {error && (
              <p className="text-xs text-red-600">{error}</p>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full h-9 bg-brand text-white text-sm font-medium rounded-md hover:bg-brand-dark transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {loading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : null}
              {loading ? 'Connexion...' : 'Se connecter'}
            </button>
          </form>
        </div>

        <p className="text-[10px] text-neutral-400 text-center mt-6">
          Centraliens &amp; Supélec Entrepreneurs
        </p>
      </div>
    </div>
  );
}
