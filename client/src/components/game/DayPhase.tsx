import { useState } from 'react';
import PlayerAvatar from '../ui/PlayerAvatar';
import { useGameStore } from '../../store/gameStore';
import { useRoomStore } from '../../store/roomStore';
import { useAuthStore } from '../../store/authStore';
import { getSocket } from '../../socket';
import { ROLE_INFO } from '../../utils/roleInfo';
import type { NightActionResult, RoleName } from 'shared';
import Timer from './Timer';

interface Props {
  currentUserId: string;
}

export default function DayPhase({ currentUserId }: Props) {
  const { dayTimerSeconds, myRole, nightActionResult, nightOrder, notes, setNotes, playerNotes, setPlayerNote, playerTags, setPlayerTrust, togglePlayerRole } = useGameStore();
  const { room } = useRoomStore();
  const { user } = useAuthStore();
  const isHost = room?.hostId === currentUserId;
  const [showRules, setShowRules] = useState(false);

  // Unique roles in this game
  const gameRoles = [...new Set(room?.settings.roles ?? [])] as RoleName[];

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

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-start">
        {/* Left column: main content */}
        <div className="flex flex-col gap-4">
          {myRole && (
            <div className={`card border ${
              ROLE_INFO[myRole].team === 'werewolf' ? 'border-red-500/30' :
              ROLE_INFO[myRole].team === 'tanner' ? 'border-gray-500/30' :
              'border-moon-500/30'
            }`}>
              <p className="text-xs text-gray-500 font-medium mb-2">Your role (keep secret!)</p>
              <div className="flex items-center gap-3 mb-3">
                <span className="text-4xl">{ROLE_INFO[myRole].emoji}</span>
                <div>
                  <p className={`text-xl font-bold ${ROLE_INFO[myRole].color}`}>{ROLE_INFO[myRole].name}</p>
                  <p className="text-xs text-gray-500">{ROLE_INFO[myRole].team === 'village' ? '🌿 Village Team' : ROLE_INFO[myRole].team === 'werewolf' ? '🐺 Werewolf Team' : '💀 Solo'}</p>
                </div>
              </div>
              {nightActionResult && (
                <div className="border-t border-white/5 pt-2 mt-1">
                  <p className="text-xs text-gray-500 font-medium mb-1">What you did last night:</p>
                  <NightSummary result={nightActionResult} />
                </div>
              )}
            </div>
          )}

          <div className="card">
            <button
              onClick={() => setShowRules(r => !r)}
              className="w-full flex items-center justify-between"
            >
              <h3 className="font-bold">Role Reference</h3>
              <span className="text-gray-500 text-sm">{showRules ? '▲ Hide' : '▼ Show'}</span>
            </button>
            {showRules && (
              <div className="mt-3 space-y-4">
                <div>
                  <p className="text-xs text-gray-500 font-medium mb-2">Night wake-up order</p>
                  <div className="flex items-center gap-1 flex-wrap">
                    {nightOrder.map((role, i) => {
                      const info = ROLE_INFO[role];
                      return (
                        <div key={i} className="flex items-center gap-1">
                          <span className="text-xs bg-night-700 rounded px-1.5 py-0.5 flex items-center gap-1">
                            <span>{info.emoji}</span>
                            <span className={`${info.color} font-medium`}>{info.name}</span>
                          </span>
                          {i < nightOrder.length - 1 && <span className="text-gray-700 text-xs">→</span>}
                        </div>
                      );
                    })}
                  </div>
                </div>
                <div className="border-t border-white/5 pt-3 space-y-3">
                  {gameRoles.map(role => {
                    const info = ROLE_INFO[role];
                    return (
                      <div key={role} className="flex gap-3">
                        <span className="text-2xl flex-shrink-0">{info.emoji}</span>
                        <div>
                          <p className={`font-semibold text-sm ${info.color}`}>{info.name}</p>
                          <p className="text-xs text-gray-400 leading-snug">{info.description}</p>
                          <p className="text-xs text-gray-600 mt-0.5 italic">{info.nightAction}</p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>

          <div className="card">
            <h3 className="font-bold mb-3">Players</h3>
            <div className="space-y-3">
              {room?.players.map(p => (
                <div key={p.userId} className="flex items-center gap-2">
                  <PlayerAvatar avatarUrl={p.avatarUrl} customAvatar={p.customAvatar} displayName={p.displayName} size={8} />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1.5">
                      <span className="text-gray-200 text-sm">{p.displayName}</span>
                      {p.userId === currentUserId && <span className="text-xs text-gray-600">(you)</span>}
                      {p.isHost && <span className="text-xs text-moon-400">host</span>}
                    </div>
                    {p.userId !== currentUserId && (
                      <div className="mt-1 space-y-1.5">
                        <input
                          type="text"
                          value={playerNotes[p.userId] ?? ''}
                          onChange={e => setPlayerNote(p.userId, e.target.value)}
                          placeholder="your read on them..."
                          maxLength={60}
                          className="w-full bg-night-700 border border-white/5 rounded px-2 py-0.5 text-xs text-gray-300 placeholder-gray-600 focus:outline-none focus:border-moon-500/40"
                        />
                        {/* Trust + suspected roles */}
                        <div className="flex items-center gap-1.5 flex-wrap">
                          {/* Two explicit trust buttons */}
                          {(() => {
                            const trust = playerTags[p.userId]?.trust ?? null;
                            return (
                              <>
                                <button
                                  onClick={() => setPlayerTrust(p.userId, trust === 'good' ? null : 'good')}
                                  title="Trust"
                                  className={`text-xs px-1.5 py-0.5 rounded border transition-all ${
                                    trust === 'good'
                                      ? 'bg-green-500/20 text-green-400 border-green-500/40'
                                      : 'text-gray-600 border-white/5 hover:text-green-400 hover:border-green-500/30'
                                  }`}
                                >
                                  👍 trust
                                </button>
                                <button
                                  onClick={() => setPlayerTrust(p.userId, trust === 'bad' ? null : 'bad')}
                                  title="Suspicious"
                                  className={`text-xs px-1.5 py-0.5 rounded border transition-all ${
                                    trust === 'bad'
                                      ? 'bg-red-500/20 text-red-400 border-red-500/40'
                                      : 'text-gray-600 border-white/5 hover:text-red-400 hover:border-red-500/30'
                                  }`}
                                >
                                  🚩 sus
                                </button>
                              </>
                            );
                          })()}
                          {/* Role chips */}
                          {gameRoles.map(role => {
                            const info = ROLE_INFO[role];
                            const active = playerTags[p.userId]?.roles.includes(role) ?? false;
                            return (
                              <button
                                key={role}
                                onClick={() => togglePlayerRole(p.userId, role)}
                                title={info.name}
                                className={`text-sm leading-none p-0.5 rounded transition-all ${
                                  active ? 'opacity-100 ring-1 ring-white/30 bg-white/10' : 'opacity-30 hover:opacity-60'
                                }`}
                              >
                                {info.emoji}
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    )}
                  </div>
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

          {/* Notepad shown below on mobile only */}
          <div className="card md:hidden">
            <p className="text-xs text-gray-500 font-medium mb-2">📝 Your Notepad <span className="text-gray-600">(private)</span></p>
            <textarea
              value={notes}
              onChange={e => setNotes(e.target.value)}
              placeholder="Jot down your suspicions, claims you heard, anything useful..."
              rows={5}
              className="w-full bg-night-700 border border-white/10 rounded-lg p-3 text-sm text-gray-200 placeholder-gray-600 focus:outline-none focus:border-moon-500/50"
            />
          </div>

          {isHost && (
            <button
              onClick={() => getSocket().emit('game:skip_day')}
              className="btn-ghost w-full py-2 text-sm"
            >
              Skip to Voting (Host)
            </button>
          )}
        </div>

        {/* Right column: notepad (desktop only) */}
        <div className="hidden md:flex flex-col gap-2 sticky top-4">
          <div className="card">
            <p className="text-xs text-gray-500 font-medium mb-2">📝 Your Notepad <span className="text-gray-600">(private — only you can see this)</span></p>
            <textarea
              value={notes}
              onChange={e => setNotes(e.target.value)}
              placeholder="Jot down your suspicions, claims you heard, anything useful..."
              rows={12}
              className="w-full bg-night-700 border border-white/10 rounded-lg p-3 text-sm text-gray-200 placeholder-gray-600 focus:outline-none focus:border-moon-500/50"
            />
          </div>
        </div>
      </div>
    </div>
  );
}

function NightSummary({ result }: { result: NightActionResult }) {
  const lines: string[] = [];

  if (result.role === 'werewolf') {
    if (result.werewolves && result.werewolves.length > 0)
      lines.push(`Fellow werewolves: ${result.werewolves.map(w => w.displayName).join(', ')}`);
    else
      lines.push('You were the only werewolf.');
  } else if (result.role === 'minion') {
    if (result.werewolves && result.werewolves.length > 0)
      lines.push(`Werewolves: ${result.werewolves.map(w => w.displayName).join(', ')}`);
    else
      lines.push('No werewolves in the game!');
  } else if (result.role === 'mason') {
    if (result.masons && result.masons.length > 0)
      lines.push(`Fellow masons: ${result.masons.map(m => m.displayName).join(', ')}`);
    else
      lines.push('You are the only mason.');
  } else if (result.role === 'seer') {
    if (result.revealedRole && result.revealedTarget)
      lines.push(`Saw ${result.revealedTarget}'s role: ${ROLE_INFO[result.revealedRole].emoji} ${ROLE_INFO[result.revealedRole].name}`);
    if (result.centerCards && result.centerCards.length > 0)
      lines.push(`Center cards: ${result.centerCards.map(c => `#${c.index + 1} ${ROLE_INFO[c.role].name}`).join(', ')}`);
  } else if (result.role === 'robber') {
    if (result.newRole)
      lines.push(`Stole from ${result.stolenFrom} — now ${ROLE_INFO[result.newRole].emoji} ${ROLE_INFO[result.newRole].name}`);
  } else if (result.role === 'troublemaker') {
    lines.push('Swapped two players\' cards.');
  } else if (result.role === 'drunk') {
    lines.push('Swapped your card with a center card. You don\'t know your new role!');
  } else if (result.role === 'insomniac') {
    if (result.currentRole)
      lines.push(`Your card is now: ${ROLE_INFO[result.currentRole].emoji} ${ROLE_INFO[result.currentRole].name}`);
  } else {
    lines.push('No night action.');
  }

  return (
    <div className="space-y-0.5">
      {lines.map((line, i) => (
        <p key={i} className="text-sm text-gray-300">{line}</p>
      ))}
    </div>
  );
}
