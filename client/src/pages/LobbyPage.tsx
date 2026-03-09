import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { useAuthStore } from '../store/authStore';

export default function LobbyPage() {
  const { user, logout } = useAuthStore();
  const navigate = useNavigate();
  const [joinCode, setJoinCode] = useState('');
  const [error, setError] = useState('');
  const [creating, setCreating] = useState(false);

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
          {user?.avatarUrl && (
            <img src={user.avatarUrl} alt="" className="w-8 h-8 rounded-full" />
          )}
          <span className="text-sm text-gray-300">{user?.displayName}</span>
          <button onClick={logout} className="btn-ghost text-sm px-3 py-1">Sign out</button>
        </div>
      </header>

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
