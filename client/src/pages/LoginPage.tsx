import { useEffect, useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';

const IS_DEV = import.meta.env.DEV;

export default function LoginPage() {
  const { user, loading, fetchUser } = useAuthStore();
  const navigate = useNavigate();
  const [devName, setDevName] = useState('');
  const [mode, setMode] = useState<'signin' | 'signup'>('signin');

  useEffect(() => {
    if (!loading && user) navigate('/');
  }, [user, loading, navigate]);

  const devLogin = async () => {
    const name = devName.trim() || 'TestPlayer';
    const id = `dev-${name.toLowerCase().replace(/\s+/g, '-')}-${Date.now()}`;
    const res = await fetch('/auth/dev/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id, name }),
      credentials: 'include',
    });
    if (res.ok) {
      await fetchUser();
      navigate('/welcome');
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-4 bg-night-950">
      <div className="absolute top-10 right-16 w-24 h-24 rounded-full bg-moon-400/20 blur-2xl" />
      <div className="absolute bottom-20 left-10 w-16 h-16 rounded-full bg-blood-500/10 blur-2xl" />

      <div className="text-center mb-10">
        <div className="text-8xl mb-4">🐺</div>
        <h1 className="text-5xl font-bold text-moon-400 mb-2">One Night</h1>
        <h2 className="text-3xl font-bold text-white mb-3">Werewolf</h2>
        <p className="text-gray-400 max-w-xs text-sm">
          A fast-paced social deduction game. One night. One vote. One chance to survive.
        </p>
      </div>

      <div className="card w-full max-w-sm">
        {/* Tab switcher */}
        <div className="flex bg-night-700 rounded-lg p-1 mb-6">
          <button
            onClick={() => setMode('signin')}
            className={`flex-1 py-2 text-sm font-semibold rounded-md transition-all ${
              mode === 'signin' ? 'bg-night-900 text-white shadow' : 'text-gray-500 hover:text-gray-300'
            }`}
          >
            Sign In
          </button>
          <button
            onClick={() => setMode('signup')}
            className={`flex-1 py-2 text-sm font-semibold rounded-md transition-all ${
              mode === 'signup' ? 'bg-night-900 text-white shadow' : 'text-gray-500 hover:text-gray-300'
            }`}
          >
            Sign Up
          </button>
        </div>

        {mode === 'signup' ? (
          <div className="text-center mb-5">
            <p className="text-gray-300 text-sm mb-1">Create your account</p>
            <p className="text-gray-500 text-xs">You'll set up your profile right after</p>
          </div>
        ) : (
          <div className="text-center mb-5">
            <p className="text-gray-300 text-sm">Welcome back!</p>
          </div>
        )}

        <a
          href="/auth/google"
          className="flex items-center justify-center gap-3 btn-ghost w-full py-3 rounded-lg"
        >
          <svg className="w-5 h-5 flex-shrink-0" viewBox="0 0 24 24">
            <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
            <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
            <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
            <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
          </svg>
          {mode === 'signup' ? 'Continue with Google' : 'Sign in with Google'}
        </a>

        <p className="text-center text-xs text-gray-600 mt-4 leading-relaxed px-2">
          By continuing, you agree that we store your Google name and email solely to run the game.
          We never sell your data.{' '}
          <Link to="/privacy" className="text-gray-500 hover:text-gray-300 underline underline-offset-2">
            Privacy Policy
          </Link>
        </p>
      </div>

      {IS_DEV && (
        <div className="mt-4 w-full max-w-sm">
          <p className="text-center text-xs text-gray-600 mb-2">— dev only —</p>
          <div className="flex gap-2">
            <input
              type="text"
              value={devName}
              onChange={e => setDevName(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && devLogin()}
              placeholder="Name (e.g. Alice)"
              className="flex-1 bg-night-800 border border-night-600 rounded-lg px-3 py-2 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-moon-400"
            />
            <button onClick={devLogin} className="btn-primary px-4 py-2 text-sm">
              Quick Login
            </button>
          </div>
        </div>
      )}

      <p className="mt-8 text-gray-600 text-sm">3–10 players &nbsp;·&nbsp; 10 minutes &nbsp;·&nbsp; All on your own devices</p>
    </div>
  );
}
