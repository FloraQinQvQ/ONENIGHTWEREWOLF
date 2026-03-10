import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';

const PRESET_AVATARS = [
  '🐺', '🦊', '🦁', '🐯', '🐻', '🦝',
  '🦅', '🦉', '🧙', '🧛', '🕵️', '🃏',
  '🎭', '👻', '🐸', '🐱',
];

function Avatar({ value, size = 'md' }: { value: string | null; size?: 'sm' | 'md' | 'lg' }) {
  const cls = size === 'lg' ? 'text-5xl w-20 h-20' : size === 'md' ? 'text-3xl w-14 h-14' : 'text-xl w-10 h-10';
  if (value) {
    return (
      <div className={`${cls} flex items-center justify-center rounded-full bg-night-700 select-none`}>
        {value}
      </div>
    );
  }
  return <div className={`${cls} rounded-full bg-night-700`} />;
}

export default function WelcomePage() {
  const { user, loading, completeProfile } = useAuthStore();
  const navigate = useNavigate();
  const [name, setName] = useState('');
  const [selectedAvatar, setSelectedAvatar] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!loading && !user) { navigate('/login', { replace: true }); return; }
    if (user) {
      // Already completed setup — skip straight to lobby
      if (user.profileSetupDone) { navigate('/', { replace: true }); return; }
      setName(user.displayName);
      setSelectedAvatar(user.customAvatar ?? PRESET_AVATARS[0]);
    }
  }, [user, loading, navigate]);

  const handleContinue = async () => {
    const trimmed = name.trim();
    if (!trimmed) return;
    setSaving(true);
    setError('');
    try {
      await completeProfile(trimmed, selectedAvatar);
      navigate('/', { replace: true });
    } catch (e: any) {
      setError(e.response?.data?.error || 'Failed to save profile');
      setSaving(false);
    }
  };

  if (loading || !user) return null;

  const displayAvatar = selectedAvatar;

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-4 bg-night-950">
      <div className="absolute top-10 right-16 w-24 h-24 rounded-full bg-moon-400/20 blur-2xl" />

      <div className="card w-full max-w-sm">
        <div className="text-center mb-6">
          <h1 className="text-xl font-bold text-white mb-1">Set up your profile</h1>
          <p className="text-gray-500 text-sm">This is how other players will see you</p>
        </div>

        {/* Avatar preview + Google fallback */}
        <div className="flex justify-center mb-5">
          <div className="relative">
            {displayAvatar ? (
              <div className="w-20 h-20 text-5xl flex items-center justify-center rounded-full bg-night-700">
                {displayAvatar}
              </div>
            ) : user.avatarUrl ? (
              <img src={user.avatarUrl} alt="" className="w-20 h-20 rounded-full" />
            ) : (
              <div className="w-20 h-20 rounded-full bg-night-700 flex items-center justify-center text-3xl text-gray-500">?</div>
            )}
          </div>
        </div>

        {/* Avatar grid */}
        <div className="mb-5">
          <p className="text-xs text-gray-500 font-medium mb-2 text-center">Choose your avatar</p>
          <div className="grid grid-cols-8 gap-1.5">
            {PRESET_AVATARS.map(emoji => (
              <button
                key={emoji}
                onClick={() => setSelectedAvatar(emoji)}
                className={`text-2xl rounded-lg p-1.5 transition-all ${
                  selectedAvatar === emoji
                    ? 'bg-moon-500/20 ring-2 ring-moon-500'
                    : 'bg-night-700 hover:bg-night-600'
                }`}
              >
                {emoji}
              </button>
            ))}
          </div>
        </div>

        {/* Name input */}
        <div className="mb-5">
          <p className="text-xs text-gray-500 font-medium mb-2">Display name</p>
          <input
            autoFocus
            type="text"
            value={name}
            onChange={e => setName(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && handleContinue()}
            maxLength={32}
            className="input w-full"
            placeholder="Your name"
          />
        </div>

        {error && <p className="text-red-400 text-sm text-center mb-3">{error}</p>}

        <button
          onClick={handleContinue}
          disabled={saving || !name.trim()}
          className="btn-primary w-full py-3 text-base"
        >
          {saving ? 'Saving...' : 'Start Playing →'}
        </button>
      </div>
    </div>
  );
}
