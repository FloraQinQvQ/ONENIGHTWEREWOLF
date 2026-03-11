import { useState } from 'react';
import PlayerAvatar from '../ui/PlayerAvatar';
import { useGameStore } from '../../store/gameStore';
import { useRoomStore } from '../../store/roomStore';
import { getSocket } from '../../socket';
import { useRoleInfo } from '../../utils/roleInfo';
import { useT } from '../../i18n';
import type { NightActionResult, RoleName } from 'shared';
import Timer from './Timer';

interface Props {
  currentUserId: string;
}

export default function DayPhase({ currentUserId }: Props) {
  const { dayTimerSeconds, myRole, nightActionResult, notes, setNotes, playerNotes, setPlayerNote, playerTags, setPlayerTrust, togglePlayerRole } = useGameStore();
  const { room } = useRoomStore();
  const roleInfo = useRoleInfo();
  const t = useT();
  const isHost = room?.hostId === currentUserId;
  const [showRules, setShowRules] = useState(false);

  // Unique roles in this game (includes center card roles — intentionally shows all)
  const gameRoles = [...new Set(room?.settings.roles ?? [])] as RoleName[];

  // All roles sorted by standard night wake-up order (used for display only)
  const NIGHT_ORDER: RoleName[] = ['werewolf', 'minion', 'mason', 'seer', 'robber', 'troublemaker', 'drunk', 'insomniac'];
  const nightSequence = [...gameRoles].sort((a, b) => {
    const ai = NIGHT_ORDER.indexOf(a);
    const bi = NIGHT_ORDER.indexOf(b);
    if (ai === -1 && bi === -1) return 0;
    if (ai === -1) return 1;
    if (bi === -1) return -1;
    return ai - bi;
  });

  const teamKey = myRole
    ? roleInfo[myRole].team === 'village' ? 'villageTeam'
    : roleInfo[myRole].team === 'werewolf' ? 'werewolfTeam'
    : 'soloTeam'
    : 'villageTeam';

  return (
    <div className="min-h-screen flex flex-col p-4 bg-night-950">
      <div className="text-center mb-6 pt-4">
        <div className="text-5xl mb-2">☀️</div>
        <h2 className="text-2xl font-bold text-white">{t('phase.day')}</h2>
        <p className="text-gray-400 text-sm mt-1">{t('daySubtitle')}</p>
      </div>

      <div className="flex justify-center mb-6">
        {dayTimerSeconds > 0
          ? <Timer seconds={dayTimerSeconds} />
          : <p className="text-gray-400 text-sm">{t('waitingHostEnd')}</p>
        }
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-start">
        {/* Left column: game info */}
        <div className="flex flex-col gap-4">
          {myRole && (
            <div className={`card border ${
              roleInfo[myRole].team === 'werewolf' ? 'border-red-500/30' :
              roleInfo[myRole].team === 'tanner' ? 'border-gray-500/30' :
              'border-moon-500/30'
            }`}>
              <p className="text-xs text-gray-500 font-medium mb-2">{t('yourRoleSecret')}</p>
              <div className="flex items-center gap-3 mb-3">
                <span className="text-4xl">{roleInfo[myRole].emoji}</span>
                <div>
                  <p className={`text-xl font-bold ${roleInfo[myRole].color}`}>{roleInfo[myRole].name}</p>
                  <p className="text-xs text-gray-500">{t(teamKey as any)}</p>
                </div>
              </div>
              {nightActionResult && (
                <div className="border-t border-white/5 pt-2 mt-1">
                  <p className="text-xs text-gray-500 font-medium mb-1">{t('whatYouDidLastNight')}</p>
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
              <h3 className="font-bold">{t('roleReference')}</h3>
              <span className="text-gray-500 text-sm">{showRules ? t('hideRef') : t('showRef')}</span>
            </button>
            {showRules && (
              <div className="mt-3 space-y-4">
                <div>
                  <p className="text-xs text-gray-500 font-medium mb-2">{t('nightWakeOrder')}</p>
                  <div className="flex items-center gap-1 flex-wrap">
                    {nightSequence.map((role, i) => {
                      const info = roleInfo[role];
                      return (
                        <div key={`${role}-${i}`} className="flex items-center gap-1">
                          <span className="text-xs bg-night-700 rounded px-1.5 py-0.5 flex items-center gap-1">
                            <span>{info.emoji}</span>
                            <span className={`${info.color} font-medium`}>{info.name}</span>
                          </span>
                          {i < nightSequence.length - 1 && <span className="text-gray-700 text-xs">→</span>}
                        </div>
                      );
                    })}
                  </div>
                </div>
                <div className="border-t border-white/5 pt-3 space-y-3">
                  {gameRoles.map(role => {
                    const info = roleInfo[role];
                    return (
                      <div key={role} className="flex gap-3">
                        <span className="text-2xl flex-shrink-0">{info.emoji}</span>
                        <div>
                          <p className={`font-semibold text-sm ${info.color}`}>{info.name}</p>
                          <p className="text-xs text-gray-400 leading-snug">{info.description}</p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>

          <div className="card bg-yellow-500/5 border-yellow-500/20">
            <p className="text-yellow-400 text-sm font-semibold mb-1">{t('discussionTips')}</p>
            <ul className="text-gray-400 text-sm space-y-1">
              <li>{t('tip1')}</li>
              <li>{t('tip2')}</li>
              <li>{t('tip3')}</li>
            </ul>
          </div>

          {/* Players + notepad on mobile */}
          <div className="md:hidden flex flex-col gap-4">
            <PlayerNotesCard
              players={room?.players ?? []}
              currentUserId={currentUserId}
              playerNotes={playerNotes}
              setPlayerNote={setPlayerNote}
              playerTags={playerTags}
              setPlayerTrust={setPlayerTrust}
              togglePlayerRole={togglePlayerRole}
              gameRoles={gameRoles}
            />
            <div className="card">
              <p className="text-xs text-gray-500 font-medium mb-2">{t('yourNotepad')} <span className="text-gray-600">{t('notepadPrivate')}</span></p>
              <textarea
                value={notes}
                onChange={e => setNotes(e.target.value)}
                placeholder={t('notepadPlaceholder')}
                rows={5}
                className="w-full bg-night-700 border border-white/10 rounded-lg p-3 text-sm text-gray-200 placeholder-gray-600 focus:outline-none focus:border-moon-500/50"
              />
            </div>
          </div>

          {isHost && (
            <button
              onClick={() => getSocket().emit('game:skip_day')}
              className="btn-ghost w-full py-2 text-sm"
            >
              {t('skipToVoting')}
            </button>
          )}
        </div>

        {/* Right column: players + notepad (desktop only) */}
        <div className="hidden md:flex flex-col gap-4 sticky top-4">
          <PlayerNotesCard
            players={room?.players ?? []}
            currentUserId={currentUserId}
            playerNotes={playerNotes}
            setPlayerNote={setPlayerNote}
            playerTags={playerTags}
            setPlayerTrust={setPlayerTrust}
            togglePlayerRole={togglePlayerRole}
            gameRoles={gameRoles}
          />
          <div className="card">
            <p className="text-xs text-gray-500 font-medium mb-2">{t('yourNotepad')} <span className="text-gray-600">{t('notepadPrivateDesc')}</span></p>
            <textarea
              value={notes}
              onChange={e => setNotes(e.target.value)}
              placeholder={t('notepadPlaceholder')}
              rows={8}
              className="w-full bg-night-700 border border-white/10 rounded-lg p-3 text-sm text-gray-200 placeholder-gray-600 focus:outline-none focus:border-moon-500/50"
            />
          </div>
        </div>
      </div>
    </div>
  );
}

interface PlayerNotesCardProps {
  players: Array<{ userId: string; displayName: string; avatarUrl: string | null; customAvatar?: string | null | undefined; isHost?: boolean }>;
  currentUserId: string;
  playerNotes: Record<string, string>;
  setPlayerNote: (userId: string, note: string) => void;
  playerTags: Record<string, { trust: 'good' | 'bad' | null; roles: RoleName[] }>;
  setPlayerTrust: (userId: string, trust: 'good' | 'bad' | null) => void;
  togglePlayerRole: (userId: string, role: RoleName) => void;
  gameRoles: RoleName[];
}

function PlayerNotesCard({ players, currentUserId, playerNotes, setPlayerNote, playerTags, setPlayerTrust, togglePlayerRole, gameRoles }: PlayerNotesCardProps) {
  const roleInfo = useRoleInfo();
  const t = useT();
  return (
    <div className="card">
      <h3 className="font-bold mb-3">{t('playersSection')}</h3>
      <div className="space-y-3">
        {players.map(p => (
          <div key={p.userId} className="flex items-start gap-2">
            <PlayerAvatar avatarUrl={p.avatarUrl} customAvatar={p.customAvatar ?? null} displayName={p.displayName} size={8} />
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-1.5">
                <span className="text-gray-200 text-sm">{p.displayName}</span>
                {p.userId === currentUserId && <span className="text-xs text-gray-600">{t('you')}</span>}
                {p.isHost && <span className="text-xs text-moon-400">{t('host')}</span>}
              </div>
              {p.userId !== currentUserId && (
                <div className="mt-1 space-y-1.5">
                  <input
                    type="text"
                    value={playerNotes[p.userId] ?? ''}
                    onChange={e => setPlayerNote(p.userId, e.target.value)}
                    placeholder={t('yourReadOnThem')}
                    maxLength={60}
                    className="w-full bg-night-700 border border-white/5 rounded px-2 py-0.5 text-xs text-gray-300 placeholder-gray-600 focus:outline-none focus:border-moon-500/40"
                  />
                  <div className="flex items-center gap-1.5 flex-wrap">
                    {(() => {
                      const trust = playerTags[p.userId]?.trust ?? null;
                      return (
                        <>
                          <button
                            onClick={() => setPlayerTrust(p.userId, trust === 'good' ? null : 'good')}
                            className={`text-xs px-1.5 py-0.5 rounded border transition-all ${
                              trust === 'good'
                                ? 'bg-green-500/20 text-green-400 border-green-500/40'
                                : 'text-gray-600 border-white/5 hover:text-green-400 hover:border-green-500/30'
                            }`}
                          >{t('trust')}</button>
                          <button
                            onClick={() => setPlayerTrust(p.userId, trust === 'bad' ? null : 'bad')}
                            className={`text-xs px-1.5 py-0.5 rounded border transition-all ${
                              trust === 'bad'
                                ? 'bg-red-500/20 text-red-400 border-red-500/40'
                                : 'text-gray-600 border-white/5 hover:text-red-400 hover:border-red-500/30'
                            }`}
                          >{t('sus')}</button>
                        </>
                      );
                    })()}
                    {gameRoles.map(role => {
                      const info = roleInfo[role];
                      const active = playerTags[p.userId]?.roles.includes(role) ?? false;
                      return (
                        <button
                          key={role}
                          onClick={() => togglePlayerRole(p.userId, role)}
                          title={info.name}
                          className={`text-sm leading-none p-0.5 rounded transition-all ${
                            active ? 'opacity-100 ring-1 ring-white/30 bg-white/10' : 'opacity-30 hover:opacity-60'
                          }`}
                        >{info.emoji}</button>
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
  );
}

function NightSummary({ result }: { result: NightActionResult }) {
  const roleInfo = useRoleInfo();
  const t = useT();
  const lines: string[] = [];

  if (result.role === 'werewolf') {
    if (result.werewolves && result.werewolves.length > 0)
      lines.push(t('nightSummary.fellowWolves', { names: result.werewolves.map(w => w.displayName).join(', ') }));
    else
      lines.push(t('nightSummary.werewolfAlone'));
  } else if (result.role === 'minion') {
    if (result.werewolves && result.werewolves.length > 0)
      lines.push(t('nightSummary.minionWolves', { names: result.werewolves.map(w => w.displayName).join(', ') }));
    else
      lines.push(t('nightSummary.minionNoWolves'));
  } else if (result.role === 'mason') {
    if (result.masons && result.masons.length > 0)
      lines.push(t('nightSummary.fellowMasons', { names: result.masons.map(m => m.displayName).join(', ') }));
    else
      lines.push(t('nightSummary.masonAlone'));
  } else if (result.role === 'seer') {
    if (result.revealedRole && result.revealedTarget)
      lines.push(t('nightSummary.seerPlayer', { name: result.revealedTarget, role: `${roleInfo[result.revealedRole].emoji} ${roleInfo[result.revealedRole].name}` }));
    if (result.centerCards && result.centerCards.length > 0)
      lines.push(t('nightSummary.seerCenter', { cards: result.centerCards.map(c => `#${c.index + 1} ${roleInfo[c.role].name}`).join(', ') }));
  } else if (result.role === 'robber') {
    if (result.newRole)
      lines.push(t('nightSummary.robber', { name: result.stolenFrom ?? '', role: `${roleInfo[result.newRole].emoji} ${roleInfo[result.newRole].name}` }));
  } else if (result.role === 'troublemaker') {
    if (result.swappedPlayers && result.swappedPlayers.length === 2)
      lines.push(t('nightSummary.troublemaker', { a: result.swappedPlayers[0].displayName, b: result.swappedPlayers[1].displayName }));
    else
      lines.push(t('nightSummary.troublemakerFallback'));
  } else if (result.role === 'drunk') {
    lines.push(t('nightSummary.drunk'));
  } else if (result.role === 'insomniac') {
    if (result.currentRole)
      lines.push(t('nightSummary.insomniac', { role: `${roleInfo[result.currentRole].emoji} ${roleInfo[result.currentRole].name}` }));
  } else {
    lines.push(t('nightSummary.noAction'));
  }

  return (
    <div className="space-y-0.5">
      {lines.map((line, i) => (
        <p key={i} className="text-sm text-gray-300">{line}</p>
      ))}
    </div>
  );
}
