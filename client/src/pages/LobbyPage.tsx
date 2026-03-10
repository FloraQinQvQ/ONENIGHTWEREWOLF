import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import axios from 'axios';
import { useAuthStore } from '../store/authStore';

const PRESET_AVATARS = [
  '🐺', '🦊', '🦁', '🐯', '🐻', '🦝',
  '🦅', '🦉', '🧙', '🧛', '🕵️', '🃏',
  '🎭', '👻', '🐸', '🐱',
];

function UserAvatar({ user, size = 8 }: { user: { avatarUrl: string | null; customAvatar: string | null; displayName: string }; size?: number }) {
  const cls = `w-${size} h-${size} rounded-full`;
  if (user.customAvatar) {
    return (
      <div className={`${cls} bg-night-700 flex items-center justify-center`} style={{ fontSize: size * 2.5 }}>
        {user.customAvatar}
      </div>
    );
  }
  if (user.avatarUrl) return <img src={user.avatarUrl} alt="" className={cls} />;
  return <div className={`${cls} bg-night-700 flex items-center justify-center text-sm`}>{user.displayName[0]}</div>;
}

export default function LobbyPage() {
  const { user, logout, completeProfile, deleteAccount } = useAuthStore();
  const navigate = useNavigate();
  const [joinCode, setJoinCode] = useState('');
  const [error, setError] = useState('');
  const [creating, setCreating] = useState(false);
  const [editingProfile, setEditingProfile] = useState(false);
  const [nameInput, setNameInput] = useState('');
  const [avatarInput, setAvatarInput] = useState<string | null>(null);
  const [profileSaving, setProfileSaving] = useState(false);
  const [profileError, setProfileError] = useState('');
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const startEdit = () => {
    setNameInput(user?.displayName ?? '');
    setAvatarInput(user?.customAvatar ?? null);
    setProfileError('');
    setConfirmDelete(false);
    setEditingProfile(true);
  };

  const handleDeleteAccount = async () => {
    setDeleting(true);
    try {
      await deleteAccount();
    } catch {
      setDeleting(false);
      setConfirmDelete(false);
    }
  };

  const saveProfile = async () => {
    if (!nameInput.trim()) return;
    setProfileSaving(true);
    setProfileError('');
    try {
      await completeProfile(nameInput.trim(), avatarInput);
      setEditingProfile(false);
    } catch (e: any) {
      setProfileError(e.response?.data?.error || 'Failed to save');
    } finally {
      setProfileSaving(false);
    }
  };

  const createRoom = async () => {
    setCreating(true);
    setError('');
    try {
      const res = await axios.post('/api/rooms', {}, { withCredentials: true });
      navigate(`/room/${res.data.code}`);
    } catch (e: any) {
      setError(e.response?.data?.error || 'Failed to create room');
    } finally {
      setCreating(false);
    }
  };

  const joinRoom = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!joinCode.trim()) return;
    const code = joinCode.trim().toUpperCase();
    try {
      await axios.get(`/api/rooms/${code}`, { withCredentials: true });
      navigate(`/room/${code}`);
    } catch (e: any) {
      setError(e.response?.data?.error || 'Room not found');
    }
  };

  return (
    <div className="min-h-screen flex flex-col p-4">
      <header className="flex items-center justify-between mb-8">
        <div className="flex items-center gap-2">
          <span className="text-2xl">🐺</span>
          <span className="font-bold text-moon-400">One Night Werewolf</span>
        </div>
        <div className="flex items-center gap-3">
          {user && <UserAvatar user={user} size={8} />}
          <button
            onClick={startEdit}
            className="flex items-center gap-1 text-sm text-gray-300 hover:text-white group"
          >
            <span>{user?.displayName}</span>
            <span className="text-gray-600 group-hover:text-gray-400 text-xs">✏️</span>
          </button>
          <button onClick={logout} className="btn-ghost text-sm px-3 py-1">Sign out</button>
        </div>
      </header>

      {/* Profile edit modal */}
      {editingProfile && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
          <div className="card w-full max-w-sm">
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-bold text-white">Edit Profile</h2>
              <button onClick={() => setEditingProfile(false)} className="text-gray-500 hover:text-white text-xl leading-none">✕</button>
            </div>

            {/* Avatar preview */}
            <div className="flex justify-center mb-4">
              {avatarInput ? (
                <div className="w-16 h-16 text-4xl flex items-center justify-center rounded-full bg-night-700">
                  {avatarInput}
                </div>
              ) : user?.avatarUrl ? (
                <img src={user.avatarUrl} alt="" className="w-16 h-16 rounded-full" />
              ) : (
                <div className="w-16 h-16 rounded-full bg-night-700" />
              )}
            </div>

            {/* Avatar grid */}
            <div className="mb-4">
              <p className="text-xs text-gray-500 mb-2">Avatar</p>
              <div className="grid grid-cols-8 gap-1.5">
                {PRESET_AVATARS.map(emoji => (
                  <button
                    key={emoji}
                    onClick={() => setAvatarInput(emoji)}
                    className={`text-2xl rounded-lg p-1 transition-all ${
                      avatarInput === emoji
                        ? 'bg-moon-500/20 ring-2 ring-moon-500'
                        : 'bg-night-700 hover:bg-night-600'
                    }`}
                  >
                    {emoji}
                  </button>
                ))}
              </div>
            </div>

            {/* Name */}
            <div className="mb-4">
              <p className="text-xs text-gray-500 mb-2">Display name</p>
              <input
                autoFocus
                value={nameInput}
                onChange={e => setNameInput(e.target.value)}
                onKeyDown={e => { if (e.key === 'Enter') saveProfile(); if (e.key === 'Escape') setEditingProfile(false); }}
                maxLength={32}
                className="input w-full"
              />
            </div>

            {profileError && <p className="text-red-400 text-sm mb-3">{profileError}</p>}

            <div className="flex gap-2 mb-4">
              <button onClick={() => setEditingProfile(false)} className="btn-ghost flex-1 py-2">Cancel</button>
              <button
                onClick={saveProfile}
                disabled={profileSaving || !nameInput.trim()}
                className="btn-primary flex-1 py-2"
              >
                {profileSaving ? 'Saving...' : 'Save'}
              </button>
            </div>

            <div className="border-t border-white/10 pt-4">
              {!confirmDelete ? (
                <button
                  onClick={() => setConfirmDelete(true)}
                  className="w-full text-xs text-gray-600 hover:text-red-400 transition-colors py-1"
                >
                  Delete my account
                </button>
              ) : (
                <div className="text-center">
                  <p className="text-xs text-red-400 mb-3">
                    This permanently deletes your account and all your data. There's no undo.
                  </p>
                  <div className="flex gap-2">
                    <button onClick={() => setConfirmDelete(false)} className="btn-ghost flex-1 py-2 text-sm">
                      Cancel
                    </button>
                    <button
                      onClick={handleDeleteAccount}
                      disabled={deleting}
                      className="flex-1 py-2 text-sm font-semibold rounded-lg bg-red-600/20 border border-red-600/40 text-red-400 hover:bg-red-600/30 transition-all disabled:opacity-50"
                    >
                      {deleting ? 'Deleting...' : 'Yes, delete everything'}
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      <div className="flex-1 flex flex-col items-center justify-center gap-6 max-w-sm mx-auto w-full">
        <div className="text-center mb-4">
          <div className="text-6xl mb-3">🌙</div>
          <h1 className="text-3xl font-bold text-white">Play Now</h1>
        </div>

        {error && (
          <div className="w-full bg-blood-500/20 border border-blood-500/50 text-red-300 rounded-lg p-3 text-sm">
            {error}
          </div>
        )}

        <button
          onClick={createRoom}
          disabled={creating}
          className="btn-primary w-full py-4 text-lg"
        >
          {creating ? 'Creating...' : '+ Create Room'}
        </button>

        <div className="flex items-center gap-3 w-full">
          <div className="flex-1 h-px bg-white/10" />
          <span className="text-gray-500 text-sm">or join</span>
          <div className="flex-1 h-px bg-white/10" />
        </div>

        <form onSubmit={joinRoom} className="w-full flex flex-col gap-3">
          <input
            type="text"
            value={joinCode}
            onChange={e => setJoinCode(e.target.value.toUpperCase())}
            placeholder="Enter room code (e.g. ABC123)"
            maxLength={6}
            className="input text-center text-xl tracking-widest uppercase font-mono"
          />
          <button type="submit" disabled={!joinCode.trim()} className="btn-ghost w-full py-3">
            Join Room
          </button>
        </form>
      </div>
    </div>
  );
}
