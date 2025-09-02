import { useState } from 'react';
import { supabase } from '../lib/supabaseClient';

export function Auth() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  async function handleSignIn(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setIsLoading(true);
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    setIsLoading(false);
    if (error) {
      setError(error.message);
    } else {
      // Clear form on successful sign in
      setEmail('');
      setPassword('');
    }
  }

  async function handleSignUp(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setIsLoading(true);
    const { error } = await supabase.auth.signUp({ email, password });
    setIsLoading(false);
    if (error) {
      setError(error.message);
    } else {
      // Clear form on successful sign up
      setEmail('');
      setPassword('');
    }
  }

  return (
    <div className="min-h-dvh grid place-items-center px-4">
      <div className="w-full max-w-sm">
        <h1 className="text-2xl font-semibold mb-6 text-center">Sign in</h1>
        <form className="space-y-3" onSubmit={handleSignIn}>
          <input
            type="email"
            placeholder="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full border rounded px-3 py-2"
            required
          />
          <input
            type="password"
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full border rounded px-3 py-2"
            required
          />
          {error && <div className="text-sm text-red-600">{error}</div>}
          <div className="flex gap-2">
            <button
              type="submit"
              disabled={isLoading}
              className="flex-1 px-3 py-2 rounded bg-gray-900 text-white"
            >
              {isLoading ? 'Signing in…' : 'Sign in'}
            </button>
            <button
              onClick={handleSignUp}
              disabled={isLoading}
              className="px-3 py-2 rounded border"
            >
              Sign up
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
