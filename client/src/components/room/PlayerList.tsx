import type { PublicPlayer } from 'shared';
import PlayerAvatar from '../ui/PlayerAvatar';

interface Props {
  players: PublicPlayer[];
  currentUserId: string;
  showReadyState?: boolean; // true = show ready/waiting badges (lobby phase)
}

export default function PlayerList({ players, currentUserId, showReadyState }: Props) {
  return (
    <div className="space-y-2">
      {players.map(p => (
        <div key={p.userId} className="flex items-center gap-3">
          <PlayerAvatar avatarUrl={p.avatarUrl} customAvatar={p.customAvatar} displayName={p.displayName} size={9} />
          <span className="flex-1 font-medium">{p.displayName}</span>
          <div className="flex gap-2 items-center">
            {p.userId === currentUserId && <span className="text-xs bg-white/10 text-gray-400 px-2 py-0.5 rounded">you</span>}
            {p.isHost && <span className="text-xs bg-moon-500/20 text-moon-400 px-2 py-0.5 rounded">host</span>}
            {showReadyState && !p.isHost && (
              p.isReady
                ? <span className="text-xs bg-green-500/20 text-green-400 px-2 py-0.5 rounded">✓ ready</span>
                : <span className="text-xs bg-white/5 text-gray-600 px-2 py-0.5 rounded">waiting</span>
            )}
          </div>
        </div>
      ))}
      {players.length === 0 && <p className="text-gray-500 text-sm">No players yet</p>}
    </div>
  );
}
