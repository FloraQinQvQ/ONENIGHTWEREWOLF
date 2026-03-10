import { useState } from 'react';
import { getSocket } from '../../socket';
import PlayerAvatar from '../ui/PlayerAvatar';
import type { NightActionRequest } from 'shared';

interface Props { request: NightActionRequest; currentUserId: string; }

export default function RobberAction({ request, currentUserId: _ }: Props) {
  const [pending, setPending] = useState<string | null>(null);

  const steal = (targetUserId: string) => {
    getSocket().emit('game:night_action', { action: { type: 'robber:steal', targetUserId } });
  };

  const skip = () => {
    getSocket().emit('game:night_action', { action: { type: 'no_action' } });
  };

  return (
    <div className="text-center max-w-sm w-full">
      <div className="text-6xl mb-3">🗡️</div>
      <h2 className="text-xl font-bold text-yellow-400 mb-2">You are the Robber!</h2>
      <p className="text-gray-400 mb-4">Steal a player's card and see your new role (optional).</p>
      <div className="space-y-3 mb-4">
        {request.players.map(p => (
          <button
            key={p.userId}
            onClick={() => setPending(p.userId)}
            className={`card w-full flex items-center gap-3 transition-all ${
              pending === p.userId ? 'border-yellow-500 bg-yellow-500/10' : 'hover:border-yellow-500/50'
            }`}
          >
            <PlayerAvatar avatarUrl={p.avatarUrl} customAvatar={p.customAvatar} displayName={p.displayName} size={8} />
            <span className="flex-1 text-left">Steal from {p.displayName}</span>
            {pending === p.userId && <span className="text-yellow-400">✓</span>}
          </button>
        ))}
      </div>
      <button
        onClick={() => steal(pending!)}
        disabled={!pending}
        className="btn-primary w-full mb-2"
      >
        {pending
          ? `Confirm — Steal from ${request.players.find(p => p.userId === pending)?.displayName}`
          : 'Select a player to steal from'}
      </button>
      <button onClick={skip} className="btn-ghost w-full">Don't steal</button>
    </div>
  );
}
