import { BrowserRouter, Routes, Route, Navigate, Link } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { supabase } from './lib/supabaseClient';
import { Home } from './pages/Home';
import { Analytics } from './pages/Analytics';
import { Auth } from './pages/Auth';

// Component to handle auth-based redirects
function AuthGuard({
  children,
  fallback,
}: {
  children: React.ReactNode;
  fallback: React.ReactNode;
}) {
  const [isLoading, setIsLoading] = useState(true);
  const [isAuthed, setIsAuthed] = useState(false);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      setIsAuthed(!!data.session);
      setIsLoading(false);
    });
    const { data: sub } = supabase.auth.onAuthStateChange((_event, session) => {
      setIsAuthed(!!session);
    });
    return () => {
      sub.subscription.unsubscribe();
    };
  }, []);

  if (isLoading) {
    return (
      <div className="min-h-dvh grid place-items-center">
        <div className="text-gray-500">Loading…</div>
      </div>
    );
  }

  return isAuthed ? <>{children}</> : <>{fallback}</>;
}

// Component for the header navigation
function HeaderNav() {
  const [isAuthed, setIsAuthed] = useState(false);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      setIsAuthed(!!data.session);
    });
    const { data: sub } = supabase.auth.onAuthStateChange((_event, session) => {
      setIsAuthed(!!session);
    });
    return () => {
      sub.subscription.unsubscribe();
    };
  }, []);

  return (
    <header className="border-b bg-white">
      <div className="mx-auto max-w-4xl px-4 py-3 flex items-center justify-between">
        <Link to="/" className="font-semibold">
          TimeTicker
        </Link>
        <nav className="flex items-center gap-3 text-sm">
          <Link to="/" className="hover:underline">
            Home
          </Link>
          <Link to="/analytics" className="hover:underline">
            Analytics
          </Link>
          {isAuthed ? (
            <button
              className="px-3 py-1 rounded bg-gray-100 hover:bg-gray-200"
              onClick={() => supabase.auth.signOut()}
            >
              Sign out
            </button>
          ) : (
            <Link
              to="/auth"
              className="px-3 py-1 rounded bg-gray-900 text-white hover:bg-black"
            >
              Sign in
            </Link>
          )}
        </nav>
      </div>
    </header>
  );
}

function App() {
  return (
    <BrowserRouter>
      <div className="min-h-dvh flex flex-col">
        <HeaderNav />
        <main className="flex-1">
          <Routes>
            <Route
              path="/"
              element={
                <AuthGuard fallback={<Navigate to="/auth" replace />}>
                  <Home />
                </AuthGuard>
              }
            />
            <Route
              path="/analytics"
              element={
                <AuthGuard fallback={<Navigate to="/auth" replace />}>
                  <Analytics />
                </AuthGuard>
              }
            />
            <Route
              path="/auth"
              element={
                <AuthGuard fallback={<Auth />}>
                  <Navigate to="/" replace />
                </AuthGuard>
              }
            />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </main>
      </div>
    </BrowserRouter>
  );
}

export default App;
