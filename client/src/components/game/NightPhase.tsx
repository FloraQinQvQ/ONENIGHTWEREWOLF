import { useState, useEffect } from 'react';
import { useGameStore } from '../../store/gameStore';
import { useRoomStore } from '../../store/roomStore';
import { useRoleInfo } from '../../utils/roleInfo';
import { useT } from '../../i18n';
import type { RoleName } from 'shared';
import WerewolfAction from '../night/WerewolfAction';
import MinionAction from '../night/MinionAction';
import MasonAction from '../night/MasonAction';
import SeerAction from '../night/SeerAction';
import RobberAction from '../night/RobberAction';
import TroublemakerAction from '../night/TroublemakerAction';
import DrunkAction from '../night/DrunkAction';
import InsomniacAction from '../night/InsomniacAction';
import NoAction from '../night/NoAction';

const NIGHT_ORDER: RoleName[] = ['werewolf', 'minion', 'mason', 'seer', 'robber', 'troublemaker', 'drunk', 'insomniac'];

interface Props {
  currentUserId: string;
}

export default function NightPhase({ currentUserId }: Props) {
  const { currentNightRole, nightActionRequest, nightActionResult, myRole } = useGameStore();
  const { room } = useRoomStore();
  const roleInfo = useRoleInfo();
  const t = useT();

  // Show ALL configured roles (including center cards) sorted by night order
  // so sleeping players can't deduce which roles are in center cards
  const allConfiguredRoles = [...new Set(room?.settings.roles ?? [])] as RoleName[];
  const displayOrder = [...allConfiguredRoles].sort((a, b) => {
    const ai = NIGHT_ORDER.indexOf(a);
    const bi = NIGHT_ORDER.indexOf(b);
    if (ai === -1 && bi === -1) return 0;
    if (ai === -1) return 1;
    if (bi === -1) return -1;
    return ai - bi;
  }).filter(r => NIGHT_ORDER.includes(r));

  const currentIndex = currentNightRole ? displayOrder.indexOf(currentNightRole) : -1;

  const isMyTurn = nightActionRequest !== null;
  const justActed = nightActionResult !== null && !isMyTurn;

  return (
    <div className="relative min-h-screen flex flex-col bg-night-950">
      {/* Night order indicator */}
      <div className="p-4 border-b border-white/5">
        <div className="flex items-center gap-2 overflow-x-auto pb-1">
          {displayOrder.map((role, i) => {
            const info = roleInfo[role];
            const isPast = currentIndex !== -1 && i < currentIndex;
            const isCurrent = role === currentNightRole;
            return (
              <div
                key={`${role}-${i}`}
                className={`flex-shrink-0 flex flex-col items-center gap-1 px-2 py-1 rounded-lg transition-all ${
                  isCurrent ? 'bg-moon-500/20 ring-1 ring-moon-500' :
                  isPast ? 'opacity-30' : 'opacity-60'
                }`}
              >
                <span className="text-lg">{info.emoji}</span>
                <span className="text-xs text-gray-400">{info.name}</span>
              </div>
            );
          })}
        </div>
      </div>

      {/* My role banner */}
      {myRole && (
        <div className={`mx-4 mt-4 flex items-center gap-3 rounded-xl px-4 py-3 border ${
          roleInfo[myRole].team === 'werewolf'
            ? 'bg-red-500/10 border-red-500/30'
            : roleInfo[myRole].team === 'tanner'
            ? 'bg-gray-500/10 border-gray-500/30'
            : 'bg-moon-500/10 border-moon-500/30'
        }`}>
          <span className="text-4xl">{roleInfo[myRole].emoji}</span>
          <div>
            <p className="text-xs text-gray-500 font-medium">{t('yourRole')}</p>
            <p className={`text-xl font-bold ${roleInfo[myRole].color}`}>{roleInfo[myRole].name}</p>
          </div>
        </div>
      )}

      <div className="flex-1 flex flex-col items-center justify-center p-4">
        {isMyTurn ? (
          <>
            <NightActionTimer totalSeconds={room?.settings.nightTimerSeconds ?? 15} resetKey={nightActionRequest?.role ?? ''} />
            <ActionPanel currentUserId={currentUserId} />
          </>
        ) : justActed ? (
          <ResultPanel currentUserId={currentUserId} />
        ) : (
          <SleepPanel role={currentNightRole} />
        )}
      </div>
    </div>
  );
}

function NightActionTimer({ totalSeconds, resetKey }: { totalSeconds: number; resetKey: string }) {
  const [left, setLeft] = useState(totalSeconds);

  useEffect(() => {
    setLeft(totalSeconds);
    const id = setInterval(() => setLeft(s => Math.max(0, s - 1)), 1000);
    return () => clearInterval(id);
  }, [resetKey, totalSeconds]);

  const pct = left / totalSeconds;
  const isUrgent = left <= 5;

  return (
    <div className="w-full max-w-sm mb-4 flex items-center gap-3">
      <div className="flex-1 h-1.5 bg-night-700 rounded-full overflow-hidden">
        <div
          className={`h-full rounded-full transition-all duration-1000 ${isUrgent ? 'bg-red-500' : 'bg-moon-500'}`}
          style={{ width: `${pct * 100}%` }}
        />
      </div>
      <span className={`text-xs font-mono tabular-nums w-6 text-right flex-shrink-0 ${isUrgent ? 'text-red-400 animate-pulse' : 'text-gray-500'}`}>
        {left}s
      </span>
    </div>
  );
}

function SleepPanel({ role }: { role: string | null }) {
  const t = useT();
  const tipIndex = role ? (role.length % 5) : 0;

  return (
    <div className="w-full max-w-sm">
      <div className="text-center mb-5">
        <div className="text-7xl mb-3 animate-pulse">😴</div>
        <h2 className="text-xl font-bold text-gray-300">{t('keepEyesClosed')}</h2>
        {role ? (
          <p className="text-gray-600 text-sm mt-1">{t('someoneActing')}</p>
        ) : (
          <p className="text-gray-600 text-sm mt-1">{t('waitingToBegin')}</p>
        )}
      </div>

      {role && (
        <div className="card border border-white/10 text-center">
          <p className="text-xs text-gray-500 font-medium mb-2">{t('whileYouWait')}</p>
          <p className="text-sm text-gray-400 leading-snug italic">{t(`tip.generic.${tipIndex}` as any)}</p>
        </div>
      )}
    </div>
  );
}

function ActionPanel({ currentUserId }: { currentUserId: string }) {
  const { nightActionRequest } = useGameStore();
  if (!nightActionRequest) return null;

  switch (nightActionRequest.role) {
    case 'werewolf': return <WerewolfAction request={nightActionRequest} />;
    case 'minion': return <MinionAction request={nightActionRequest} />;
    case 'mason': return <MasonAction request={nightActionRequest} />;
    case 'seer': return <SeerAction request={nightActionRequest} />;
    case 'robber': return <RobberAction request={nightActionRequest} currentUserId={currentUserId} />;
    case 'troublemaker': return <TroublemakerAction request={nightActionRequest} currentUserId={currentUserId} />;
    case 'drunk': return <DrunkAction request={nightActionRequest} />;
    case 'insomniac': return <InsomniacAction />;
    default: return <NoAction role={nightActionRequest.role} />;
  }
}

function ResultPanel({ currentUserId: _u }: { currentUserId: string }) {
  const { nightActionResult } = useGameStore();
  const roleInfo = useRoleInfo();
  const t = useT();
  if (!nightActionResult) return null;
  const info = roleInfo[nightActionResult.role];

  return (
    <div className="text-center max-w-sm w-full">
      <div className="text-5xl mb-4">{info.emoji}</div>
      <h2 className="text-xl font-bold mb-4 text-moon-400">{t('actionComplete')}</h2>

      <div className="card text-left space-y-2">
        {nightActionResult.werewolves && nightActionResult.werewolves.length > 0 && (
          <div>
            <p className="text-sm text-gray-400">{t('werewolves')}</p>
            {nightActionResult.werewolves.map(w => (
              <p key={w.userId} className="text-red-400 font-semibold">{w.displayName} 🐺</p>
            ))}
          </div>
        )}
        {nightActionResult.werewolves && nightActionResult.werewolves.length === 0 && nightActionResult.role === 'minion' && (
          <p className="text-yellow-400">{t('na.minion.noWolves')}</p>
        )}
        {nightActionResult.masons && (
          <div>
            <p className="text-sm text-gray-400">{t('fellowMasons')}</p>
            {nightActionResult.masons.length === 0
              ? <p className="text-blue-400">{t('onlyMason')}</p>
              : nightActionResult.masons.map(m => (
                  <p key={m.userId} className="text-blue-400 font-semibold">{m.displayName} 🔨</p>
                ))
            }
          </div>
        )}
        {nightActionResult.revealedRole && (
          <div>
            <p className="text-sm text-gray-400">
              {nightActionResult.revealedTarget}'s role:
            </p>
            <p className={`font-bold ${roleInfo[nightActionResult.revealedRole].color}`}>
              {roleInfo[nightActionResult.revealedRole].emoji} {roleInfo[nightActionResult.revealedRole].name}
            </p>
          </div>
        )}
        {nightActionResult.centerCards && nightActionResult.centerCards.length > 0 && (
          <div>
            <p className="text-sm text-gray-400">{t('centerCards')}</p>
            {nightActionResult.centerCards.map(c => (
              <p key={c.index} className={`font-bold ${roleInfo[c.role].color}`}>
                #{c.index + 1}: {roleInfo[c.role].emoji} {roleInfo[c.role].name}
              </p>
            ))}
          </div>
        )}
        {nightActionResult.newRole && (
          <div>
            <p className="text-sm text-gray-400">{t('stolenFrom', { name: nightActionResult.stolenFrom ?? '' })}</p>
            <p className="text-sm text-gray-400">{t('yourNewRole')}</p>
            <p className={`font-bold text-lg ${roleInfo[nightActionResult.newRole].color}`}>
              {roleInfo[nightActionResult.newRole].emoji} {roleInfo[nightActionResult.newRole].name}
            </p>
          </div>
        )}
        {nightActionResult.currentRole && (
          <div>
            <p className="text-sm text-gray-400">{t('yourCurrentRole')}</p>
            <p className={`font-bold text-lg ${roleInfo[nightActionResult.currentRole].color}`}>
              {roleInfo[nightActionResult.currentRole].emoji} {roleInfo[nightActionResult.currentRole].name}
            </p>
          </div>
        )}
        {nightActionResult.role === 'drunk' && (
          <p className="text-amber-400">{t('drunkResult')}</p>
        )}
        {nightActionResult.role === 'troublemaker' && (
          <p className="text-pink-400">
            {nightActionResult.swappedPlayers && nightActionResult.swappedPlayers.length === 2
              ? t('nightSummary.troublemaker', { a: nightActionResult.swappedPlayers[0].displayName, b: nightActionResult.swappedPlayers[1].displayName })
              : t('nightSummary.troublemakerFallback')}
          </p>
        )}
      </div>

      <p className="mt-4 text-gray-500 text-sm">{t('rememberInfo')}</p>
      <p className="mt-2 text-gray-600 text-sm animate-pulse">{t('waitingOthers')}</p>
    </div>
  );
}
