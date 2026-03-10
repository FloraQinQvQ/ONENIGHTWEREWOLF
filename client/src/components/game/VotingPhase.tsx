import { useState } from 'react';
import PlayerAvatar from '../ui/PlayerAvatar';
import { getSocket } from '../../socket';
import { useGameStore } from '../../store/gameStore';
import { useRoomStore } from '../../store/roomStore';
import { ROLE_INFO } from '../../utils/roleInfo';

interface Props {
  currentUserId: string;
}

export default function VotingPhase({ currentUserId }: Props) {
  const { voteCounts, myVote, setMyVote, notes, setNotes, playerNotes, playerTags } = useGameStore();
  const { room } = useRoomStore();
  const [selected, setSelected] = useState<string | null>(null);
  const hasVoted = myVote !== null;

  const submitVote = () => {
    if (!selected) return;
    getSocket().emit('game:submit_vote', { targetUserId: selected });
    setMyVote(selected);
  };

  const otherPlayers = room?.players.filter(p => p.userId !== currentUserId) ?? [];
  const votedCount = room?.players.filter(p => p.hasVoted).length ?? 0;
  const totalCount = room?.players.length ?? 0;
  const allVoted = votedCount === totalCount && totalCount > 0;

  return (
    <div className="min-h-screen flex flex-col p-4 bg-night-950">
      <div className="text-center mb-6 pt-4">
        <div className="text-5xl mb-2">🗳️</div>
        <h2 className="text-2xl font-bold text-white">Time to Vote!</h2>
        <p className="text-gray-400 text-sm mt-1">
          {hasVoted ? 'Vote submitted. Waiting for others...' : 'Vote for who you think is a Werewolf'}
        </p>
        <p className="text-gray-500 text-xs mt-2">{votedCount} / {totalCount} voted</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-start">
        {/* Left column: voting */}
        <div className="flex flex-col gap-4">
          {/* Notepad on mobile only */}
          {notes.trim() && (
            <div className="card md:hidden">
              <p className="text-xs text-gray-500 font-medium mb-2">📝 Your Notepad</p>
              <textarea
                value={notes}
                onChange={e => setNotes(e.target.value)}
                rows={4}
                className="w-full bg-night-700 border border-white/10 rounded-lg p-3 text-sm text-gray-200 focus:outline-none focus:border-moon-500/50"
              />
            </div>
          )}

          {!hasVoted ? (
            <>
              <div className="space-y-3">
                {otherPlayers.map(p => (
                  <button
                    key={p.userId}
                    onClick={() => setSelected(p.userId)}
                    className={`w-full flex items-center gap-3 p-4 rounded-xl border transition-all ${
                      selected === p.userId
                        ? 'border-moon-500 bg-moon-500/10'
                        : 'border-white/10 bg-night-800 hover:border-white/30'
                    }`}
                  >
                    <PlayerAvatar avatarUrl={p.avatarUrl} customAvatar={p.customAvatar} displayName={p.displayName} size={10} />
                    <div className="flex-1 text-left min-w-0">
                      <p className="font-semibold">{p.displayName}</p>
                      {/* Trust badge + suspected role chips */}
                      {(playerTags[p.userId]?.trust || (playerTags[p.userId]?.roles ?? []).length > 0) && (
                        <div className="flex items-center gap-1 flex-wrap mt-1">
                          {playerTags[p.userId]?.trust === 'good' && (
                            <span className="text-xs px-1.5 py-0.5 rounded bg-green-500/20 text-green-400 border border-green-500/30 font-medium">👍 trusted</span>
                          )}
                          {playerTags[p.userId]?.trust === 'bad' && (
                            <span className="text-xs px-1.5 py-0.5 rounded bg-red-500/20 text-red-400 border border-red-500/30 font-medium">🚩 sus</span>
                          )}
                          {(playerTags[p.userId]?.roles ?? []).map(r => (
                            <span key={r} className="text-xs px-1.5 py-0.5 rounded bg-night-700 border border-white/10 text-gray-300">
                              {ROLE_INFO[r].emoji} {ROLE_INFO[r].name}
                            </span>
                          ))}
                        </div>
                      )}
                      {playerNotes[p.userId] && (
                        <p className="text-xs text-gray-500 truncate mt-0.5">{playerNotes[p.userId]}</p>
                      )}
                    </div>
                    {selected === p.userId && <span className="text-moon-400 flex-shrink-0">✓</span>}
                  </button>
                ))}
              </div>

              <button
                onClick={submitVote}
                disabled={!selected}
                className="btn-danger w-full py-4 text-lg"
              >
                Cast Vote {selected ? `for ${room?.players.find(p => p.userId === selected)?.displayName}` : ''}
              </button>
            </>
          ) : (
            <div className="flex flex-col items-center py-8">
              <p className="text-gray-400 text-lg mb-6">
                You voted for <span className="text-moon-400 font-bold">
                  {room?.players.find(p => p.userId === myVote)?.displayName}
                </span>
              </p>
              {allVoted ? (
                <div className="space-y-2 w-full max-w-sm">
                  {room?.players.map(p => (
                    <div key={p.userId} className="flex items-center gap-2">
                      <span className="text-sm text-gray-300 w-32 truncate">{p.displayName}</span>
                      <div className="flex-1 bg-night-700 rounded h-2">
                        <div
                          className="bg-moon-500 h-2 rounded transition-all"
                          style={{ width: `${Math.min((voteCounts[p.userId] ?? 0) / totalCount * 100 * 2, 100)}%` }}
                        />
                      </div>
                      <span className="text-sm text-gray-400 w-6 text-right">{voteCounts[p.userId] ?? 0}</span>
                    </div>
                  ))}
                </div>
              ) : (
                <>
                  <div className="text-6xl mb-4 animate-pulse">⏳</div>
                  <p className="text-gray-600 text-sm">Results revealed when everyone votes</p>
                </>
              )}
            </div>
          )}
        </div>

        {/* Right column: notepad (desktop only) */}
        {notes.trim() && (
          <div className="hidden md:block sticky top-4">
            <div className="card">
              <p className="text-xs text-gray-500 font-medium mb-2">📝 Your Notepad</p>
              <textarea
                value={notes}
                onChange={e => setNotes(e.target.value)}
                rows={12}
                className="w-full bg-night-700 border border-white/10 rounded-lg p-3 text-sm text-gray-200 focus:outline-none focus:border-moon-500/50"
              />
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
