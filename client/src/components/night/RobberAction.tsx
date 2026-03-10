import { getSocket } from '../../socket';
import PlayerAvatar from '../ui/PlayerAvatar';
import type { NightActionRequest } from 'shared';

interface Props { request: NightActionRequest; currentUserId: string; }

export default function RobberAction({ request, currentUserId: _ }: Props) {
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
            onClick={() => steal(p.userId)}
            className="card w-full flex items-center gap-3 hover:border-yellow-500/50 transition-all"
          >
            <PlayerAvatar avatarUrl={p.avatarUrl} customAvatar={p.customAvatar} displayName={p.displayName} size={8} />
            <span>Steal from {p.displayName}</span>
          </button>
        ))}
      </div>
      <button onClick={skip} className="btn-ghost w-full">Don't steal</button>
    </div>
  );
}
