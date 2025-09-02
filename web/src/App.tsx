import { BrowserRouter, Routes, Route, Navigate, Link } from 'react-router-dom'
import { useEffect, useState } from 'react'
import { supabase } from './lib/supabaseClient'
import { Home } from './pages/Home'
import { Analytics } from './pages/Analytics'
import { Auth } from './pages/Auth'

function App() {
  const [isLoading, setIsLoading] = useState(true)
  const [isAuthed, setIsAuthed] = useState(false)

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      setIsAuthed(!!data.session)
      setIsLoading(false)
    })
    const { data: sub } = supabase.auth.onAuthStateChange((_event, session) => {
      setIsAuthed(!!session)
    })
    return () => {
      sub.subscription.unsubscribe()
    }
  }, [])

  if (isLoading) {
    return (
      <div className="min-h-dvh grid place-items-center">
        <div className="text-gray-500">Loading…</div>
      </div>
    )
  }

  return (
    <BrowserRouter>
      <div className="min-h-dvh flex flex-col">
        <header className="border-b bg-white">
          <div className="mx-auto max-w-4xl px-4 py-3 flex items-center justify-between">
            <Link to="/" className="font-semibold">TimeTicker</Link>
            <nav className="flex items-center gap-3 text-sm">
              <Link to="/" className="hover:underline">Home</Link>
              <Link to="/analytics" className="hover:underline">Analytics</Link>
              {isAuthed ? (
                <button className="px-3 py-1 rounded bg-gray-100 hover:bg-gray-200" onClick={() => supabase.auth.signOut()}>Sign out</button>
              ) : (
                <Link to="/auth" className="px-3 py-1 rounded bg-gray-900 text-white hover:bg-black">Sign in</Link>
              )}
            </nav>
          </div>
        </header>
        <main className="flex-1">
          <Routes>
            <Route path="/" element={isAuthed ? <Home /> : <Navigate to="/auth" replace />} />
            <Route path="/analytics" element={isAuthed ? <Analytics /> : <Navigate to="/auth" replace />} />
            <Route path="/auth" element={<Auth />} />
            <Route path="*" element={<Navigate to={isAuthed ? '/' : '/auth'} replace />} />
          </Routes>
        </main>
      </div>
    </BrowserRouter>
  )
}

export default App
