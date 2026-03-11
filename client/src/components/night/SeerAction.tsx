import { useState } from 'react';
import PlayerAvatar from '../ui/PlayerAvatar';
import { getSocket } from '../../socket';
import { useT } from '../../i18n';
import type { NightActionRequest } from 'shared';

interface Props { request: NightActionRequest; }

export default function SeerAction({ request }: Props) {
  const t = useT();
  const [pendingPlayer, setPendingPlayer] = useState<string | null>(null);
  const [selectedCenter, setSelectedCenter] = useState<string[]>([]);

  const submitPlayer = () => {
    if (!pendingPlayer) return;
    getSocket().emit('game:night_action', { action: { type: 'seer:view_player', targetUserId: pendingPlayer } });
  };

  const submitCenter = () => {
    if (selectedCenter.length !== 2) return;
    getSocket().emit('game:night_action', {
      action: { type: 'seer:view_center', centerIndices: [parseInt(selectedCenter[0]), parseInt(selectedCenter[1])] },
    });
  };

  const toggleCenter = (i: string) => {
    setSelectedCenter(prev =>
      prev.includes(i) ? prev.filter(x => x !== i) : prev.length < 2 ? [...prev, i] : prev
    );
  };

  const skip = () => {
    getSocket().emit('game:night_action', { action: { type: 'no_action' } });
  };

  return (
    <div className="text-center max-w-sm w-full">
      <div className="text-6xl mb-3">🔮</div>
      <h2 className="text-xl font-bold text-purple-400 mb-2">{t('na.seer.title')}</h2>
      <p className="text-gray-400 mb-4">{t('na.seer.desc')}</p>

      {/* Player list */}
      <div className="space-y-3 mb-3">
        {request.players.map(p => (
          <button
            key={p.userId}
            onClick={() => setPendingPlayer(pendingPlayer === p.userId ? null : p.userId)}
            className={`card w-full flex items-center gap-3 transition-all ${
              pendingPlayer === p.userId ? 'border-purple-500 bg-purple-500/10' : 'hover:border-purple-500/50'
            }`}
          >
            <PlayerAvatar avatarUrl={p.avatarUrl} customAvatar={p.customAvatar} displayName={p.displayName} size={8} />
            <span className="flex-1 text-left">{p.displayName}</span>
            {pendingPlayer === p.userId && <span className="text-purple-400">✓</span>}
          </button>
        ))}
      </div>

      <p className="text-xs text-gray-600 mb-3">{t('na.seer.orCenter')}</p>

      {/* Center cards */}
      <div className="grid grid-cols-3 gap-3 mb-4">
        {[0, 1, 2].map(i => (
          <button
            key={i}
            onClick={() => { setPendingPlayer(null); toggleCenter(String(i)); }}
            className={`card py-6 transition-all ${selectedCenter.includes(String(i)) ? 'border-purple-500 bg-purple-500/10' : 'hover:border-purple-500/40'}`}
          >
            <p className="text-sm text-gray-400">{t('na.seer.center', { n: i + 1 })}</p>
            <p className="text-2xl">🃏</p>
            {selectedCenter.includes(String(i)) && <p className="text-xs text-purple-400">✓</p>}
          </button>
        ))}
      </div>

      <button
        onClick={pendingPlayer ? submitPlayer : submitCenter}
        disabled={!pendingPlayer && selectedCenter.length !== 2}
        className="btn-primary w-full mb-2"
      >
        {pendingPlayer
          ? t('na.seer.confirmPlayer', { name: request.players.find(p => p.userId === pendingPlayer)?.displayName ?? '' })
          : selectedCenter.length === 2
            ? t('na.seer.confirmCenter', { a: parseInt(selectedCenter[0]) + 1, b: parseInt(selectedCenter[1]) + 1 })
            : t('na.seer.selectTarget')}
      </button>
      <button onClick={skip} className="btn-ghost w-full">{t('na.seer.skip')}</button>
    </div>
  );
}
