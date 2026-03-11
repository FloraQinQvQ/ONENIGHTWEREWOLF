import { useGameStore } from '../../store/gameStore';
import { useRoomStore } from '../../store/roomStore';
import { ROLE_INFO } from '../../utils/roleInfo';
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
  }).filter(r => NIGHT_ORDER.includes(r)); // only show roles with night actions

  const currentIndex = currentNightRole ? displayOrder.indexOf(currentNightRole) : -1;

  const isMyTurn = nightActionRequest !== null;
  const justActed = nightActionResult !== null && !isMyTurn;

  return (
    <div className="relative min-h-screen flex flex-col bg-night-950">
      {/* Night order indicator */}
      <div className="p-4 border-b border-white/5">
        <div className="flex items-center gap-2 overflow-x-auto pb-1">
          {displayOrder.map((role, i) => {
            const info = ROLE_INFO[role];
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
          ROLE_INFO[myRole].team === 'werewolf'
            ? 'bg-red-500/10 border-red-500/30'
            : ROLE_INFO[myRole].team === 'tanner'
            ? 'bg-gray-500/10 border-gray-500/30'
            : 'bg-moon-500/10 border-moon-500/30'
        }`}>
          <span className="text-4xl">{ROLE_INFO[myRole].emoji}</span>
          <div>
            <p className="text-xs text-gray-500 font-medium">Your role</p>
            <p className={`text-xl font-bold ${ROLE_INFO[myRole].color}`}>{ROLE_INFO[myRole].name}</p>
          </div>
        </div>
      )}

      <div className="flex-1 flex flex-col items-center justify-center p-4">
        {isMyTurn ? (
          <ActionPanel currentUserId={currentUserId} />
        ) : justActed ? (
          <ResultPanel currentUserId={currentUserId} />
        ) : (
          <SleepPanel role={currentNightRole} />
        )}
      </div>
    </div>
  );
}

const GENERIC_TIPS = [
  'Stay still and keep your eyes closed. Every sound matters.',
  'Think about what role you are and how to use it during discussion.',
  'Someone nearby may be learning something crucial right now.',
  'Remember: cards can be swapped. What you think you know may be wrong.',
  'Pay attention to any hesitation or sounds around you.',
];

function SleepPanel({ role }: { role: string | null }) {
  // Pick a stable tip index based on the role string so it doesn't flicker
  const tipIndex = role ? (role.length % GENERIC_TIPS.length) : 0;

  return (
    <div className="w-full max-w-sm">
      <div className="text-center mb-5">
        <div className="text-7xl mb-3 animate-pulse">😴</div>
        <h2 className="text-xl font-bold text-gray-300">Keep your eyes closed...</h2>
        {role ? (
          <p className="text-gray-600 text-sm mt-1">Someone is performing their night action</p>
        ) : (
          <p className="text-gray-600 text-sm mt-1">Waiting for night to begin...</p>
        )}
      </div>

      {role && (
        <div className="card border border-white/10 text-center">
          <p className="text-xs text-gray-500 font-medium mb-2">💭 While you wait...</p>
          <p className="text-sm text-gray-400 leading-snug italic">{GENERIC_TIPS[tipIndex]}</p>
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
  if (!nightActionResult) return null;
  const info = ROLE_INFO[nightActionResult.role];

  return (
    <div className="text-center max-w-sm w-full">
      <div className="text-5xl mb-4">{info.emoji}</div>
      <h2 className="text-xl font-bold mb-4 text-moon-400">Action Complete</h2>

      <div className="card text-left space-y-2">
        {nightActionResult.werewolves && nightActionResult.werewolves.length > 0 && (
          <div>
            <p className="text-sm text-gray-400">Werewolves:</p>
            {nightActionResult.werewolves.map(w => (
              <p key={w.userId} className="text-red-400 font-semibold">{w.displayName} 🐺</p>
            ))}
          </div>
        )}
        {nightActionResult.werewolves && nightActionResult.werewolves.length === 0 && nightActionResult.role === 'minion' && (
          <p className="text-yellow-400">No Werewolves in game! You're on your own.</p>
        )}
        {nightActionResult.masons && (
          <div>
            <p className="text-sm text-gray-400">Fellow Masons:</p>
            {nightActionResult.masons.length === 0
              ? <p className="text-blue-400">You are the only Mason.</p>
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
            <p className={`font-bold ${ROLE_INFO[nightActionResult.revealedRole].color}`}>
              {ROLE_INFO[nightActionResult.revealedRole].emoji} {ROLE_INFO[nightActionResult.revealedRole].name}
            </p>
          </div>
        )}
        {nightActionResult.centerCards && nightActionResult.centerCards.length > 0 && (
          <div>
            <p className="text-sm text-gray-400">Center cards:</p>
            {nightActionResult.centerCards.map(c => (
              <p key={c.index} className={`font-bold ${ROLE_INFO[c.role].color}`}>
                #{c.index + 1}: {ROLE_INFO[c.role].emoji} {ROLE_INFO[c.role].name}
              </p>
            ))}
          </div>
        )}
        {nightActionResult.newRole && (
          <div>
            <p className="text-sm text-gray-400">You stole from {nightActionResult.stolenFrom}.</p>
            <p className="text-sm text-gray-400">Your new role:</p>
            <p className={`font-bold text-lg ${ROLE_INFO[nightActionResult.newRole].color}`}>
              {ROLE_INFO[nightActionResult.newRole].emoji} {ROLE_INFO[nightActionResult.newRole].name}
            </p>
          </div>
        )}
        {nightActionResult.currentRole && (
          <div>
            <p className="text-sm text-gray-400">Your current role is:</p>
            <p className={`font-bold text-lg ${ROLE_INFO[nightActionResult.currentRole].color}`}>
              {ROLE_INFO[nightActionResult.currentRole].emoji} {ROLE_INFO[nightActionResult.currentRole].name}
            </p>
          </div>
        )}
        {nightActionResult.role === 'drunk' && (
          <p className="text-amber-400">You swapped your card with a center card. You have no idea what you are now!</p>
        )}
        {nightActionResult.role === 'troublemaker' && (
          <p className="text-pink-400">
            {nightActionResult.swappedPlayers && nightActionResult.swappedPlayers.length === 2
              ? `Swapped ${nightActionResult.swappedPlayers[0].displayName}'s and ${nightActionResult.swappedPlayers[1].displayName}'s cards!`
              : 'You swapped two players\' cards. Chaos ensued!'}
          </p>
        )}
      </div>

      <p className="mt-4 text-gray-500 text-sm">Remember this information for the discussion!</p>
      <p className="mt-2 text-gray-600 text-sm animate-pulse">Waiting for others to finish...</p>
    </div>
  );
}
