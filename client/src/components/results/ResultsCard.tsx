import { useGameStore } from '../../store/gameStore';
import { ROLE_INFO, teamColor, teamLabel } from '../../utils/roleInfo';
import type { RoleName } from 'shared';

interface Props {
  onLeave: () => void;
  currentUserId: string;
}

export default function ResultsCard({ onLeave, currentUserId }: Props) {
  const { results } = useGameStore();
  if (!results) return null;

  const isWinner = results.winners.includes(currentUserId);
  const killed = results.killed;

  return (
    <div className="min-h-screen flex flex-col p-4 max-w-lg mx-auto">
      {/* Banner */}
      <div className={`text-center py-8 rounded-2xl mb-4 ${
        isWinner ? 'bg-green-500/10 border border-green-500/30' : 'bg-red-500/10 border border-red-500/30'
      }`}>
        <div className="text-6xl mb-2">{isWinner ? '🏆' : '💀'}</div>
        <h2 className={`text-3xl font-bold mb-1 ${isWinner ? 'text-green-400' : 'text-red-400'}`}>
          {isWinner ? 'You Won!' : 'You Lost!'}
        </h2>
        <div className={`text-lg font-semibold mb-2 ${teamColor(results.winTeam)}`}>
          {teamLabel(results.winTeam)} Team Wins
        </div>
        <p className="text-gray-400 text-sm px-4">{results.reason}</p>
      </div>

      {/* Killed players */}
      {killed.length > 0 && (
        <div className="card mb-4">
          <h3 className="font-bold text-red-400 mb-2">☠️ Eliminated</h3>
          {killed.map(uid => {
            const p = results.players.find(x => x.userId === uid);
            return p ? (
              <div key={uid} className="flex items-center gap-2 mb-1">
                {p.avatarUrl
                  ? <img src={p.avatarUrl} alt="" className="w-7 h-7 rounded-full" />
                  : <div className="w-7 h-7 rounded-full bg-night-700 flex items-center justify-center text-xs">{p.displayName[0]}</div>
                }
                <span className="text-gray-200">{p.displayName}</span>
              </div>
            ) : null;
          })}
        </div>
      )}
      {killed.length === 0 && (
        <div className="card mb-4 text-center text-gray-400">No one was eliminated!</div>
      )}

      {/* Role reveal */}
      <div className="card mb-4">
        <h3 className="font-bold mb-3">Final Roles</h3>
        <div className="space-y-2">
          {results.players.map(p => {
            const original = results.originalRoles[p.userId] as RoleName;
            const final = results.finalRoles[p.userId] as RoleName;
            const changed = original !== final;
            const origInfo = ROLE_INFO[original];
            const finalInfo = ROLE_INFO[final];
            const isMe = p.userId === currentUserId;
            return (
              <div key={p.userId} className={`flex items-start gap-3 p-2 rounded-lg ${isMe ? 'bg-white/5' : ''}`}>
                {p.avatarUrl
                  ? <img src={p.avatarUrl} alt="" className="w-8 h-8 rounded-full flex-shrink-0" />
                  : <div className="w-8 h-8 rounded-full bg-night-700 flex items-center justify-center text-xs flex-shrink-0">{p.displayName[0]}</div>
                }
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1">
                    <span className="font-semibold text-sm truncate">{p.displayName}</span>
                    {isMe && <span className="text-xs text-gray-500">(you)</span>}
                    {results.winners.includes(p.userId) && <span className="text-xs text-yellow-400">🏆</span>}
                  </div>
                  <div className="flex items-center gap-2 text-sm mt-0.5">
                    <span className={origInfo.color}>{origInfo.emoji} {origInfo.name}</span>
                    {changed && (
                      <>
                        <span className="text-gray-600">→</span>
                        <span className={finalInfo.color}>{finalInfo.emoji} {finalInfo.name}</span>
                      </>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Center cards */}
      <div className="card mb-4">
        <h3 className="font-bold mb-2">Center Cards</h3>
        <div className="grid grid-cols-3 gap-2">
          {results.centerCards.map((role, i) => {
            const info = ROLE_INFO[role as RoleName];
            return (
              <div key={i} className="bg-night-700 rounded-lg p-3 text-center">
                <div className="text-xl">{info.emoji}</div>
                <div className={`text-xs font-semibold ${info.color}`}>{info.name}</div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Vote breakdown */}
      <div className="card mb-6">
        <h3 className="font-bold mb-2">Votes</h3>
        <div className="space-y-1">
          {Object.entries(results.votes).map(([voterId, targetId]) => {
            if (!targetId) return null;
            const voter = results.players.find(p => p.userId === voterId);
            const target = results.players.find(p => p.userId === targetId);
            return voter && target ? (
              <div key={voterId} className="text-sm text-gray-400">
                <span className="text-gray-200">{voter.displayName}</span>
                {' voted for '}
                <span className="text-gray-200">{target.displayName}</span>
              </div>
            ) : null;
          })}
        </div>
      </div>

      <button onClick={onLeave} className="btn-primary w-full py-4 text-lg">
        Play Again
      </button>
    </div>
  );
}
