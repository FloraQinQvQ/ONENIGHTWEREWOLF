import { useGameStore } from '../../store/gameStore';
import { useRoomStore } from '../../store/roomStore';
import { useAuthStore } from '../../store/authStore';
import { getSocket } from '../../socket';
import { ROLE_INFO } from '../../utils/roleInfo';
import Timer from './Timer';

interface Props {
  currentUserId: string;
}

export default function DayPhase({ currentUserId }: Props) {
  const { dayTimerSeconds, myRole } = useGameStore();
  const { room } = useRoomStore();
  const { user } = useAuthStore();
  const isHost = room?.hostId === currentUserId;

  return (
    <div className="min-h-screen flex flex-col p-4 bg-night-950">
      <div className="text-center mb-6 pt-4">
        <div className="text-5xl mb-2">☀️</div>
        <h2 className="text-2xl font-bold text-white">Day Phase</h2>
        <p className="text-gray-400 text-sm mt-1">Discuss, debate, and find the Werewolves!</p>
      </div>

      <div className="flex justify-center mb-6">
        {dayTimerSeconds > 0
          ? <Timer seconds={dayTimerSeconds} />
          : <p className="text-gray-400 text-sm">Waiting for host to end discussion...</p>
        }
      </div>

      {myRole && (
        <div className="card mb-4">
          <p className="text-sm text-gray-400 mb-1">Your role (keep secret!):</p>
          <div className="flex items-center gap-2">
            <span className="text-2xl">{ROLE_INFO[myRole].emoji}</span>
            <span className={`font-bold ${ROLE_INFO[myRole].color}`}>{ROLE_INFO[myRole].name}</span>
          </div>
        </div>
      )}

      <div className="card mb-4">
        <h3 className="font-bold mb-3">Players</h3>
        <div className="space-y-2">
          {room?.players.map(p => (
            <div key={p.userId} className="flex items-center gap-3">
              {p.avatarUrl
                ? <img src={p.avatarUrl} alt="" className="w-8 h-8 rounded-full" />
                : <div className="w-8 h-8 rounded-full bg-night-700 flex items-center justify-center text-sm">{p.displayName[0]}</div>
              }
              <span className="text-gray-200">{p.displayName}</span>
              {p.userId === currentUserId && <span className="text-xs text-gray-500">(you)</span>}
              {p.isHost && <span className="text-xs text-moon-400">host</span>}
            </div>
          ))}
        </div>
      </div>

      <div className="card bg-yellow-500/5 border-yellow-500/20">
        <p className="text-yellow-400 text-sm font-semibold mb-1">Discussion Tips:</p>
        <ul className="text-gray-400 text-sm space-y-1">
          <li>• Share what you saw during the night (or lie!)</li>
          <li>• Look for inconsistencies in others' stories</li>
          <li>• Remember: cards may have been swapped!</li>
        </ul>
      </div>

      {isHost && (
        <button
          onClick={() => getSocket().emit('game:skip_day')}
          className="btn-ghost mt-4 w-full py-2 text-sm"
        >
          Skip to Voting (Host)
        </button>
      )}
    </div>
  );
}
